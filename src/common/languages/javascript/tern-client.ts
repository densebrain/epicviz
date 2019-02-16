import getLogger from "common/log/Logger"

const Worker = require("!!worker-loader!ts-loader?transpileOnly=true!./worker.ts")
//!!worker-loader?inline=true!

/* eslint-disable */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://CM.net/LICENSE

// Glue code between CodeMirror and Tern.
//
// Create a CM.TernServer to wrap an actual Tern server,
// register open documents (CM.Doc instances) with it, and
// call its methods to activate the assisting functions that Tern
// provides.
//
// Options supported (all optional):
// * defs: An array of JSON definition data structures.
// * plugins: An object mapping plugin names to configuration
//   options.
// * getFile: A function(name, c) that can be used to access files in
//   the project that haven't been loaded yet. Simply do c(null) to
//   indicate that a file is not available.
// * fileFilter: A function(value, docName, doc) that will be applied
//   to documents before passing them on to Tern.
// * switchToDoc: A function(name, doc) that should, when providing a
//   multi-file view, switch the view or focus to the named file.
// * showError: A function(editor, message) that can be used to
//   override the way errors are displayed.
// * completionTip: Customize the content in tooltips for completions.
//   Is passed a single argument—the completion's data as returned by
//   Tern—and may return a string, DOM node, or null to indicate that
//   no tip should be shown. By default the docstring is shown.
// * typeTip: Like completionTip, but for the tooltips shown for type
//   queries.
// * responseFilter: A function(doc, query, request, error, data) that
//   will be applied to the Tern responses before treating them
//
//
// It is possible to run the Tern server in a web worker by specifying
// these additional options:
// * useWorker: Set to true to enable web worker mode. You'll probably
//   want to feature detect the actual value you use here, for example
//   !!window.Worker.
// * workerScript: The main script of the worker. Point this to
//   wherever you are hosting worker.js from this directory.
// * workerDeps: An array of paths pointing (relative to workerScript)
//   to the Acorn and Tern libraries and any Tern plugins you want to
//   load. Or, if you minified those into a single script and included
//   them in the workerScript, simply leave this undefined.
//"use strict";

const log = getLogger(__filename)
const CM = require("codemirror/lib/codemirror")


// declare global: tern

CM.TernServer = function (options) {
  const self = this
  this.options = options || {};
  const plugins = this.options.plugins || (this.options.plugins = {})
  if (!plugins.doc_comment) plugins.doc_comment = true;
  this.docs = Object.create(null);
  this.server = new WorkerServer(this)
  // if (this.options.useWorker) {
  //
  // } else {
  //   this.server = new tern.Server({
  //     getFile: function (name, c) {
  //       return getFile(self, name, c);
  //     },
  //     async: true,
  //     defs: this.options.defs || [],
  //     plugins: plugins
  //   });
  //}
  this.trackChange = function (doc, change) {
    trackChange(self, doc, change);
  };

  this.cachedArgHints = null;
  this.activeArgHints = null;
  this.jumpStack = [];

  this.getHint = function (cm, c) {
    return hint(self, cm, c);
  };
  this.getHint.async = true;
};

CM.TernServer.prototype = {
  addRaw: function (name, data) {
    this.server.addFile(name, data);
    return this.docs[name] = data;
  },
  addDoc: function (name, doc) {
    const data = {doc: doc, name: name, changed: null}
    this.server.addFile(name, docValue(this, data));
    CM.on(doc, "change", this.trackChange);
    return this.docs[name] = data;
  },

  delDoc: function (id) {
    const found = resolveDoc(this, id)
    if (!found) return;
    CM.off(found.doc, "change", this.trackChange);
    delete this.docs[found.name];
    this.server.delFile(found.name);
  },

  hideDoc: function (id) {
    closeArgHints(this);
    const found = resolveDoc(this, id)
    if (found && found.changed) sendDoc(this, found);
  },

  complete: function (cm) {
    cm.showHint({hint: this.getHint});
  },

  showType: function (cm, pos, c) {
    showContextInfo(this, cm, pos, "type", c);
  },

  showDocs: function (cm, pos, c) {
    showContextInfo(this, cm, pos, "documentation", c);
  },

  updateArgHints: function (cm) {
    updateArgHints(this, cm);
  },

  jumpToDef: function (cm) {
    jumpToDef(this, cm);
  },

  jumpBack: function (cm) {
    jumpBack(this, cm);
  },

  rename: function (cm) {
    rename(this, cm);
  },

  selectName: function (cm) {
    selectName(this, cm);
  },

  request: function (cm, query, c, pos) {
    const self = this
    const doc = findDoc(this, cm.getDoc())
    const request = buildRequest(this, doc, query, pos)
    const extraOptions = request.query && this.options.queryOptions && this.options.queryOptions[request.query.type]
    if (extraOptions) for (let prop in extraOptions) request.query[prop] = extraOptions[prop];

    this.server.request(request, function (error, data) {
      if (!error && self.options.responseFilter)
        data = self.options.responseFilter(doc, query, request, error, data);
      c(error, data);
    });
  },

  destroy: function () {
    closeArgHints(this)
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
};

const Pos = CM.Pos
const cls = "CodeMirror-Tern-"
const bigDoc = 250

function getFile(ts, name, c) {
  const
    buf = ts.docs[name]


  if (buf)
    c(docValue(ts, buf));
  else if (ts.options.getFile)
    ts.options.getFile(name, c);
  else
    c(null);
}

function findDoc(ts, doc, name = null) {
  let n
  for (n in ts.docs) {
    const cur = ts.docs[n]
    if (cur.doc == doc) return cur;
  }
  if (!name) for (let i = 0; ; ++i) {
    n = "[doc" + (i || "") + "]";
    if (!ts.docs[n]) {
      name = n;
      break;
    }
  }
  return ts.addDoc(name, doc);
}

function resolveDoc(ts, id) {
  if (typeof id == "string") return ts.docs[id];
  if (id instanceof CM) id = id.getDoc();
  if (id instanceof CM.Doc) return findDoc(ts, id);
}

function trackChange(ts, doc, change) {
  const data = findDoc(ts, doc)

  const argHints = ts.cachedArgHints
  if (argHints && argHints.doc == doc && cmpPos(argHints.start, change.to) >= 0)
    ts.cachedArgHints = null;

  let changed = data.changed
  if (changed == null)
    data.changed = changed = {from: change.from.line, to: change.from.line};
  const end = change.from.line + (change.text.length - 1)
  if (change.from.line < changed.to) changed.to = changed.to - (change.to.line - end);
  if (end >= changed.to) changed.to = end + 1;
  if (changed.from > change.from.line) changed.from = change.from.line;

  if (doc.lineCount() > bigDoc && change.to - changed.from > 100) setTimeout(function () {
    if (data.changed && data.changed.to - data.changed.from > 100) sendDoc(ts, data);
  }, 200);
}

function sendDoc(ts, doc) {
  ts.server.request({files: [{type: "full", name: doc.name, text: docValue(ts, doc)}]}, function (error) {
    if (error) window.console.error(error);
    else doc.changed = null;
  });
}

// Completion

function hint(ts, cm, c) {
  ts.request(cm, {type: "completions", types: true, docs: true, urls: true}, function (error, data) {
    if (error) return showError(ts, cm, error);
    const completions = []
    let after = ""
    const from = data.start, to = data.end
    if (cm.getRange(Pos(from.line, from.ch - 2), from) == "[\"" &&
      cm.getRange(to, Pos(to.line, to.ch + 2)) != "\"]")
      after = "\"]";

    for (let i = 0; i < data.completions.length; ++i) {
      const completion = data.completions[i]
      let className = typeToIcon(completion.type)
      if (data.guess) className += " " + cls + "guess";
      completions.push({
        text: completion.name + after,
        displayText: completion.displayName || completion.name,
        className: className,
        data: completion
      });
    }

    const obj = {from: from, to: to, list: completions}
    let tooltip = null
    CM.on(obj, "close", function () {
      remove(tooltip);
    });
    CM.on(obj, "update", function () {
      remove(tooltip);
    });
    CM.on(obj, "select", function (cur, node) {
      remove(tooltip);
      const content = ts.options.completionTip ? ts.options.completionTip(cur.data) : cur.data.doc
      if (content) {
        tooltip = makeTooltip(node.parentNode.getBoundingClientRect().right + window.pageXOffset,
          node.getBoundingClientRect().top + window.pageYOffset, content);
        tooltip.className += " " + cls + "hint-doc";
      }
    });
    c(obj);
  });
}

function typeToIcon(type) {
  let suffix
  if (type == "?") suffix = "unknown";
  else if (type == "number" || type == "string" || type == "bool") suffix = type;
  else if (/^fn\(/.test(type)) suffix = "fn";
  else if (/^\[/.test(type)) suffix = "array";
  else suffix = "object";
  return cls + "completion " + cls + "completion-" + suffix;
}

// Type queries

function showContextInfo(ts, cm, pos, queryName, c) {
  ts.request(cm, queryName, function (error, data) {
    if (error) return showError(ts, cm, error);
    if (ts.options.typeTip) {
      var tip = ts.options.typeTip(data);
    } else {
      var tip = elt("span", null, elt("strong", null, data.type || "not found"));
      if (data.doc)
        tip.appendChild(document.createTextNode(" — " + data.doc));
      if (data.url) {
        tip.appendChild(document.createTextNode(" "));
        const child = tip.appendChild(elt("a", null, "[docs]"))
        child.href = data.url;
        child.target = "_blank";
      }
    }
    tempTooltip(cm, tip, ts);
    if (c) c();
  }, pos);
}

// Maintaining argument hints

function updateArgHints(ts, cm) {
  closeArgHints(ts);

  if (cm.somethingSelected()) return;
  const state = cm.getTokenAt(cm.getCursor()).state
  const inner = CM.innerMode(cm.getMode(), state)
  if (inner.mode.name != "javascript") return;
  const lex = inner.state.lexical
  if (lex.info != "call") return;

  let ch
  const argPos = lex.pos || 0, tabSize = cm.getOption("tabSize")
  for (var line = cm.getCursor().line, e = Math.max(0, line - 9), found = false; line >= e; --line) {
    const str = cm.getLine(line)
    let extra = 0
    for (let pos = 0; ;) {
      const tab = str.indexOf("\t", pos)
      if (tab == -1) break;
      extra += tabSize - (tab + extra) % tabSize - 1;
      pos = tab + 1;
    }
    ch = lex.column - extra;
    if (str.charAt(ch) == "(") {
      found = true;
      break;
    }
  }
  if (!found) return;

  const start = Pos(line, ch)
  const cache = ts.cachedArgHints
  if (cache && cache.doc == cm.getDoc() && cmpPos(start, cache.start) == 0)
    return showArgHints(ts, cm, argPos);

  ts.request(cm, {type: "type", preferFunction: true, end: start}, function (error, data) {
    if (error || !data.type || !(/^fn\(/).test(data.type)) return;
    ts.cachedArgHints = {
      start: start,
      type: parseFnType(data.type),
      name: data.exprName || data.name || "fn",
      guess: data.guess,
      doc: cm.getDoc()
    };
    showArgHints(ts, cm, argPos);
  });
}

function showArgHints(ts, cm, pos) {
  closeArgHints(ts);

  const cache = ts.cachedArgHints, tp = cache.type
  const tip = elt("span", cache.guess ? cls + "fhint-guess" : null,
    elt("span", cls + "fname", cache.name), "(")
  for (let i = 0; i < tp.args.length; ++i) {
    if (i) tip.appendChild(document.createTextNode(", "));
    const arg = tp.args[i]
    tip.appendChild(elt("span", cls + "farg" + (i == pos ? " " + cls + "farg-current" : ""), arg.name || "?"));
    if (arg.type != "?") {
      tip.appendChild(document.createTextNode(":\u00a0"));
      tip.appendChild(elt("span", cls + "type", arg.type));
    }
  }
  tip.appendChild(document.createTextNode(tp.rettype ? ") ->\u00a0" : ")"));
  if (tp.rettype) tip.appendChild(elt("span", cls + "type", tp.rettype));
  const place = cm.cursorCoords(null, "page")
  const tooltip = ts.activeArgHints = makeTooltip(place.right + 1, place.bottom, tip)
  setTimeout(function () {
    tooltip.clear = onEditorActivity(cm, function () {
      if (ts.activeArgHints == tooltip) closeArgHints(ts)
    })
  }, 20)
}

function parseFnType(text) {
  const args = []
  let pos = 3

  function skipMatching(upto) {
    let depth = 0
    const start = pos
    for (; ;) {
      const next = text.charAt(pos)
      if (upto.test(next) && !depth) return text.slice(start, pos);
      if (/[{\[\(]/.test(next)) ++depth;
      else if (/[}\]\)]/.test(next)) --depth;
      ++pos;
    }
  }

  // Parse arguments
  if (text.charAt(pos) != ")") for (; ;) {
    let name = text.slice(pos).match(/^([^, \(\[\{]+): /)
    if (name) {
      pos += name[0].length;
      name = name[1];
    }
    args.push({name: name, type: skipMatching(/[\),]/)});
    if (text.charAt(pos) == ")") break;
    pos += 2;
  }

  const rettype = text.slice(pos).match(/^\) -> (.*)$/)

  return {args: args, rettype: rettype && rettype[1]};
}

// Moving to the definition of something

function jumpToDef(ts, cm) {
  function inner(varName = null) {
    const req = {type: "definition", variable: varName || null}
    const doc = findDoc(ts, cm.getDoc())
    ts.server.request(buildRequest(ts, doc, req), function (error, data) {
      if (error) return showError(ts, cm, error);
      if (!data.file && data.url) {
        window.open(data.url);
        return;
      }

      if (data.file) {
        const localDoc = ts.docs[data.file]
        let found
        if (localDoc && (found = findContext(localDoc.doc, data))) {
          ts.jumpStack.push({
            file: doc.name,
            start: cm.getCursor("from"),
            end: cm.getCursor("to")
          });
          moveTo(ts, doc, localDoc, found.start, found.end);
          return;
        }
      }
      showError(ts, cm, "Could not find a definition.");
    });
  }

  if (!atInterestingExpression(cm))
    dialog(cm, "Jump to variable", function (name) {
      if (name) inner(name);
    });
  else
    inner();
}

function jumpBack(ts, cm) {
  const pos = ts.jumpStack.pop(), doc = pos && ts.docs[pos.file]
  if (!doc) return;
  moveTo(ts, findDoc(ts, cm.getDoc()), doc, pos.start, pos.end);
}

function moveTo(ts, curDoc, doc, start, end) {
  doc.doc.setSelection(start, end);
  if (curDoc != doc && ts.options.switchToDoc) {
    closeArgHints(ts);
    ts.options.switchToDoc(doc.name, doc.doc);
  }
}

// The {line,ch} representation of positions makes this rather awkward.
function findContext(doc, data) {
  const before = data.context.slice(0, data.contextOffset).split("\n")
  const startLine = data.start.line - (before.length - 1)
  const start = Pos(startLine, (before.length == 1 ? data.start.ch : doc.getLine(startLine).length) - before[0].length)

  let text = doc.getLine(startLine).slice(start.ch)
  for (let cur = startLine + 1; cur < doc.lineCount() && text.length < data.context.length; ++cur)
    text += "\n" + doc.getLine(cur);
  if (text.slice(0, data.context.length) == data.context) return data;

  const cursor = doc.getSearchCursor(data.context, 0, false)
  let nearest, nearestDist = Infinity
  while (cursor.findNext()) {
    const from = cursor.from()
    let dist = Math.abs(from.line - start.line) * 10000
    if (!dist) dist = Math.abs(from.ch - start.ch);
    if (dist < nearestDist) {
      nearest = from;
      nearestDist = dist;
    }
  }
  if (!nearest) return null;

  if (before.length == 1)
    nearest.ch += before[0].length;
  else
    nearest = Pos(nearest.line + (before.length - 1), before[before.length - 1].length);
  if (data.start.line == data.end.line)
    var end = Pos(nearest.line, nearest.ch + (data.end.ch - data.start.ch));
  else
    var end = Pos(nearest.line + (data.end.line - data.start.line), data.end.ch);
  return {start: nearest, end: end};
}

function atInterestingExpression(cm) {
  const pos = cm.getCursor("end"), tok = cm.getTokenAt(pos)
  if (tok.start < pos.ch && tok.type == "comment") return false;
  return /[\w)\]]/.test(cm.getLine(pos.line).slice(Math.max(pos.ch - 1, 0), pos.ch + 1));
}

// Variable renaming

function rename(ts, cm) {
  const token = cm.getTokenAt(cm.getCursor())
  if (!/\w/.test(token.string)) return showError(ts, cm, "Not at a variable");
  dialog(cm, "New name for " + token.string, function (newName) {
    ts.request(cm, {type: "rename", newName: newName, fullDocs: true}, function (error, data) {
      if (error) return showError(ts, cm, error);
      applyChanges(ts, data.changes);
    });
  });
}

function selectName(ts, cm) {
  const name = findDoc(ts, cm.doc).name
  ts.request(cm, {type: "refs"}, function (error, data) {
    if (error) return showError(ts, cm, error);
    const ranges = []
    let cur = 0
    const curPos = cm.getCursor()
    for (let i = 0; i < data.refs.length; i++) {
      const ref = data.refs[i]
      if (ref.file == name) {
        ranges.push({anchor: ref.start, head: ref.end});
        if (cmpPos(curPos, ref.start) >= 0 && cmpPos(curPos, ref.end) <= 0)
          cur = ranges.length - 1;
      }
    }
    cm.setSelections(ranges, cur);
  });
}

let nextChangeOrig = 0

function applyChanges(ts, changes) {
  const perFile = Object.create(null)
  for (let i = 0; i < changes.length; ++i) {
    const ch = changes[i];
    (perFile[ch.file] || (perFile[ch.file] = [])).push(ch);
  }
  for (let file in perFile) {
    const known = ts.docs[file], chs = perFile[file];
    if (!known) continue;
    chs.sort(function (a, b) {
      return cmpPos(b.start, a.start);
    });
    const origin = "*rename" + (++nextChangeOrig)
    for (let i = 0; i < chs.length; ++i) {
      const ch = chs[i];
      known.doc.replaceRange(ch.text, ch.start, ch.end, origin);
    }
  }
}

// Generic request-building helper

function buildRequest(ts, doc, query, pos = null) {
  let files = [], offsetLines = 0, allowFragments = !query.fullDocs;
  if (!allowFragments) delete query.fullDocs;
  if (typeof query == "string") query = {type: query};
  query.lineCharPositions = true;
  if (query.end == null) {
    query.end = pos || doc.doc.getCursor("end");
    if (doc.doc.somethingSelected())
      query.start = doc.doc.getCursor("start");
  }
  const startPos = query.start || query.end

  if (doc.changed) {
    if (doc.doc.lineCount() > bigDoc && allowFragments !== false &&
      doc.changed.to - doc.changed.from < 100 &&
      doc.changed.from <= startPos.line && doc.changed.to > query.end.line) {
      files.push(getFragmentAround(doc, startPos, query.end));
      query.file = "#0";
      const offsetLines = files[0].offsetLines;
      if (query.start != null) query.start = Pos(query.start.line - -offsetLines, query.start.ch);
      query.end = Pos(query.end.line - offsetLines, query.end.ch);
    } else {
      files.push({
        type: "full",
        name: doc.name,
        text: docValue(ts, doc)
      });
      query.file = doc.name;
      doc.changed = null;
    }
  } else {
    query.file = doc.name;
  }
  for (let name in ts.docs) {
    const cur = ts.docs[name]
    if (cur.changed && cur != doc) {
      files.push({type: "full", name: cur.name, text: docValue(ts, cur)});
      cur.changed = null;
    }
  }

  return {query: query, files: files};
}

function getFragmentAround(data, start, end) {
  const doc = data.doc
  let minIndent = null, minLine = null, endLine
  const tabSize = 4
  let p = start.line - 1, min = Math.max(0, p - 50)
  for (; p >= min; --p) {
    const line = doc.getLine(p), fn = line.search(/\bfunction\b/)
    if (fn < 0) continue;
    const indent = CM.countColumn(line, null, tabSize);
    if (minIndent != null && minIndent <= indent) continue;
    minIndent = indent;
    minLine = p;
  }
  if (minLine == null) minLine = min;
  const max = Math.min(doc.lastLine(), end.line + 20)
  if (minIndent == null || minIndent == CM.countColumn(doc.getLine(start.line), null, tabSize))
    endLine = max;
  else for (endLine = end.line + 1; endLine < max; ++endLine) {
    const indent = CM.countColumn(doc.getLine(endLine), null, tabSize);
    if (indent <= minIndent) break;
  }
  const from = Pos(minLine, 0)

  return {
    type: "part",
    name: data.name,
    offsetLines: from.line,
    text: doc.getRange(from, Pos(endLine, end.line == endLine ? null : 0))
  };
}

// Generic utilities

let cmpPos = CM.cmpPos;

function elt(tagname, cls, ...args /*, ... elts*/) {
  const e = document.createElement(tagname)
  if (cls) e.className = cls;
  for (let i = 0; i < args.length; ++i) {
    let elt = args[i]
    if (typeof elt == "string") elt = document.createTextNode(elt);
    e.appendChild(elt);
  }
  return e;
}

function dialog(cm, text, f) {
  if (cm.openDialog)
    cm.openDialog(text + ": <input type=text>", f);
  else
    f(prompt(text, ""));
}

// Tooltips

function tempTooltip(cm, content, ts) {
  if (cm.state.ternTooltip) remove(cm.state.ternTooltip);
  const where = cm.cursorCoords()
  const tip = cm.state.ternTooltip = makeTooltip(where.right + 1, where.bottom, content)

  function maybeClear() {
    old = true;
    if (!mouseOnTip) clear();
  }

  function clear() {
    cm.state.ternTooltip = null;
    if (tip.parentNode) fadeOut(tip)
    clearActivity()
  }

  var mouseOnTip = false, old = false;
  CM.on(tip, "mousemove", function () {
    mouseOnTip = true;
  });
  CM.on(tip, "mouseout", function (e) {
    const related = e.relatedTarget || e.toElement
    if (!related || !CM.contains(tip, related)) {
      if (old) clear();
      else mouseOnTip = false;
    }
  });
  setTimeout(maybeClear, ts.options.hintDelay ? ts.options.hintDelay : 1700);
  var clearActivity = onEditorActivity(cm, clear)
}

function onEditorActivity(cm, f) {
  cm.on("cursorActivity", f)
  cm.on("blur", f)
  cm.on("scroll", f)
  cm.on("setDoc", f)
  return function () {
    cm.off("cursorActivity", f)
    cm.off("blur", f)
    cm.off("scroll", f)
    cm.off("setDoc", f)
  }
}

function makeTooltip(x, y, content) {
  const node = elt("div", cls + "tooltip", content)
  node.style.left = x + "px";
  node.style.top = y + "px";
  document.body.appendChild(node);
  return node;
}

function remove(node) {
  const p = node && node.parentNode
  if (p) p.removeChild(node);
}

function fadeOut(tooltip) {
  tooltip.style.opacity = "0";
  setTimeout(function () {
    remove(tooltip);
  }, 1100);
}

function showError(ts, cm, msg) {
  if (ts.options.showError)
    ts.options.showError(cm, msg);
  else
    tempTooltip(cm, String(msg), ts);
}

function closeArgHints(ts) {
  if (ts.activeArgHints) {
    if (ts.activeArgHints.clear) ts.activeArgHints.clear()
    remove(ts.activeArgHints)
    ts.activeArgHints = null
  }
}

function docValue(ts, doc) {
  let val = doc.doc.getValue()
  if (ts.options.fileFilter) val = ts.options.fileFilter(val, doc.name, doc.doc);
  return val;
}

// Worker wrapper

function WorkerServer(ts) {
  const worker = ts.worker = new Worker()
  worker.postMessage({
    type: "init",
    projectDir: ts.options.projectDir,
    defs: ts.options.defs,
    plugins: ts.options.plugins,
    files: ts.options.files
  });
  let msgId = 0, pending = {}

  function send(data, c = null) {
    if (c) {
      data.id = ++msgId;
      pending[msgId] = c;
    }
    worker.postMessage(data);
  }

  worker.onmessage = function (e) {
    const data = e.data
    if (data.type == "getFile") {
      getFile(ts, data.name, function (err, text) {
        //log.info("Getting file", data.name, data, err,text)
        send({
          type: "getFile",
          err: String(err),
          text: text, id: data.id
        })
      })
    } else if (data.type == "debug") {
      window.console.log(data.message);
    } else if (data.id && pending[data.id]) {
      pending[data.id](data.err, data.body);
      delete pending[data.id];
    }
  };
  worker.onerror = function (e) {
    for (let id in pending) pending[id](e);
    pending = {};
  };

  this.addFile = function (name, text) {
    send({type: "add", name: name, text: text});
  };
  this.delFile = function (name) {
    send({type: "del", name: name});
  };
  this.request = function (body, c) {
    send({type: "req", body: body}, c);
  };
}

export default CM.TernServer