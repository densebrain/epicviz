import _ from 'lodash';
//import * as Debug from "v8-debug"
import ReplConstants from './ReplConstants';
import ReplCommon from './ReplCommon';
import util from 'util';
import ReplEntryOutputError from './ReplEntryOutputError';
import {EOL} from 'os';
import React from 'react';
import ReplDOM from './ReplDOM';
//import ReplConsoleHook from '../common/ReplConsoleHook';
import ReplOutputFunction from './ReplOutputFunction';
import ReplOutputArray from './ReplOutputArray';
import ReplOutputObject from './ReplOutputObject';
import ReplOutputInteger from './ReplOutputInteger';
import ReplOutputPromise from './ReplOutputPromise';
import ReplOutputRegex from './ReplOutputRegex';
import ReplOutputString from './ReplOutputString';
import ReplOutputColor from './ReplOutputColor';
import ReplOutputURL from './ReplOutputURL';
import ReplOutputCrypto from './ReplOutputCrypto';
import ReplOutputHTML from './ReplOutputHTML';
import ReplOutputBuffer from './ReplOutputBuffer';
import ReplOutputDate from './ReplOutputDate';
//import ReplSourceFile from './ReplSourceFile';
import ReplOutputTranspile from './ReplOutputTranspile';
//import ReplContext from './ReplContext';

//const Debug = require('vm').runInDebugContext('Debug');
//const MakeMirror = Debug.get('MakeMirror')
const makeMirror = (o) => o //MakeMirror(o, true);
const BabelCoreJS = require("babel-runtime/core-js");

const getObjectLabels = (o) => {
  if(o._isReactElement) {
    return ` ReactElement {}`;
  }

  if(o instanceof Error) {
    return ` ${o.name} {}`;
  }

  if(Buffer.isBuffer(o)) {
    return ` Buffer (${o.length} bytes) {}`;
  }

  return null;
}

const ReplOutputType = {
  promise: (status, value, p) => {
    return <ReplOutputPromise initStatus={status} initValue={value} promise={p}/>;
  },
  buffer: (buf) => {
    return <ReplOutputBuffer buffer={buf} image={ReplCommon.getImageData(buf)}/>;
  },
  primitive: (n, type) => {
    const prefix = `${type} {`;
    const suffix = '}';
    const className = type === 'Number' ? 'cm-number' : 'cm-literal';
    return (
      <span className='primitive-object'>
        {prefix}
        <span className='primitive-key'>[[PrimitiveValue]]</span>:
        <span className={className}>{n.toString()}</span>
        {suffix}
      </span>);
  },
  number: (n) => {
    if(_.isFinite(n) && ((n | 0) === n)) {
      // integers
      return <ReplOutputInteger int={n} />
    }
    return <span className='cm-number'>{n}</span>;
  },
  boolean: (b) => {
    return <span className='cm-atom'>{b.toString()}</span>;
  },
  array: (a, meta = { type: 'Array', proto: Array.prototype }) => {
    const tokenize = (arr, result, range, mul=1) => {
      const len = result.length;
      if(arr.length < range) {
        const label = result.length
          ? ['[',len * range * mul, ' … ', (len * range * mul) - 1 + arr.length % range,']'].join('')
          : [meta.type, '[',arr.length,']'].join('');
        result.push(<ReplOutputArray proto={meta.proto}
          array={arr} label={label} start={len * range * mul} noIndex={false}/>);
      } else {
        const label = ['[', len * range * mul, ' … ', (len + 1) * range * mul - 1, ']'].join('');
        result.push(<ReplOutputArray proto={meta.proto}
          array={arr.splice(0, range)} label={label} start={len * range * mul} noIndex={false}/>);
        tokenize(arr, result, range, mul);
      }
    };

    const arr = _.clone(a);
    let arrays = [];
    tokenize(arr, arrays, 100);

    if(arrays.length > 100) {
      const arr1000 = [];
      tokenize(arrays, arr1000, 100, 100);
      arrays = arr1000;
    }

    if(arrays.length > 1) {
      return <ReplOutputArray array={arrays}
        label={[meta.type,'[',a.length,']'].join('')}
        proto={meta.proto}
        start={0} noIndex={true} length={a.length}/>
    } else {
      return arrays;
    }
  },
  date: (d) => {
    return <ReplOutputDate date={d} />
  },
  object: (o) => {

    if(_.isError(o)) {
      const
        stack = o.stack.split(EOL),
        lines = stack.slice(1),
        firstGoodIndex = lines.findIndex(line => /Error:/.test(line)),
        goodStack = firstGoodIndex === -1 ? stack : lines.slice(Math.max(0,firstGoodIndex))

      let errorLine, errorFile, errorPosition, first, rest, syntaxError;
      if (o instanceof SyntaxError && !goodStack[0].match(/^SyntaxError:/)) {
        [errorFile, errorLine, errorPosition, first, ...rest] = goodStack;
        syntaxError = {error:errorLine, caret: errorPosition, file: errorFile};
      } else {
        [first, ...rest] = goodStack;
      }
      return (<ReplEntryOutputError message={first} trace={rest} syntaxError={syntaxError}>
      </ReplEntryOutputError>);
    }

    if(Array.isArray(o)){
      return ReplOutputType.array(o);
    }

    if(Buffer.isBuffer(o) || ReplCommon.isUint8Array(o)) {
      return ReplOutputType['buffer'](o);
    }

    if(ReplCommon.isTypedArray(o)) {
      const arrayLike = ReplCommon.toArray(o);
      return ReplOutputType.array(arrayLike, {type: ReplCommon.type(o), proto: o.__proto__});
    }

    if(_.isDate(o)) {
      return ReplOutputType.date(o);
    }

    if(_.isRegExp(o)) {
      return ReplOutputType.regexp(o);
    }

    if(_.isNull(o)) {
      return ReplOutputType['null'](o);
    }

    if(_.isNumber(o)) {
      return ReplOutputType['primitive'](o, 'Number');
    }

    if(_.isBoolean(o)) {
      return ReplOutputType['primitive'](o, 'Boolean');
    }

    if(o instanceof Promise || o.then) {
      const m = makeMirror(o);
      if(m.isPromise()) {
        return ReplOutputType['promise'](m.status(), m.promiseValue().value(), o);
      }
    }

    return <ReplOutputObject object={o} label={getObjectLabels(o)} primitive={_.isString(o)}/>
  },
  undefined: (u) => {
    return <span className='cm-atom'>undefined</span>;
  },
  function: (f) => {
    const code = f.toString();
    const funElement = ReplCommon.highlight(code, 'js');
    let expandable = false, shortElement = '';
    const idx = code.indexOf(EOL);
    if(idx !== -1) {
      shortElement = ReplCommon.highlight(code.slice(0, idx), 'js');
      expandable = true;
    }
    return <ReplOutputFunction html={funElement} fun={f} expandable={expandable} short={shortElement}/>
  },
  string: (s) => {
    // string is a color
    if(ReplCommon.isCSSColor(s)) {
      return <ReplOutputColor str={s}/>;
    }

    if(ReplCommon.isURL(s)) {
      return <ReplOutputURL url={s}/>;
    }

    if(ReplCommon.isBase64(s)) {
      const decode = ReplCommon.decodeBase64(s);
      const dom = (typeof decode === 'string')
        ? <ReplOutputString str={decode}/>
        : ReplOutputType['buffer'](decode);
      return <ReplOutputCrypto type='base64' encode={<ReplOutputString str={s}/>} decode={dom}/>;
    }

    const body = ReplDOM.toHTMLBody(s);
    if(body) {
      const source = <ReplOutputString str={s} limit={ReplConstants.OUTPUT_TRUNCATE_LENGTH / 2}/>;
      return <ReplOutputHTML body={body} source={source}/>;
    }

    return <ReplOutputString str={s}/>;
  },
  symbol: (sy) => {
    return <span className='cm-variable'>{sy.toString()}</span>;
  },
  regexp: (re) => {
    return <ReplOutputRegex regex={re} />;
  },
  null: () => {
    return <span className='cm-atom'>null</span>;
  }
};


class None {
  constructor() {
    return None.instance;
  }
  getValue() { return void 0; }
  highlight(output = '') {
    const [first, ...rest] = (output.stack || output.toString()).split(EOL);
    return {
      formattedOutput:
        <ReplEntryOutputError message={first} trace={rest}>
        </ReplEntryOutputError>,
      error: true
    };
  }
  static instance = new None();
}

class Some {
  constructor(value) {
    this.value = value;
  }
  getValue() { return this.value; }
  highlight(output) {
    return {
      formattedOutput: ReplOutput.transformObject(this.value) || this.value,
      error: false
    };
  }
}

const ReplOutput = {
  some: (value) => new Some(value),
  none: () => None.instance,
  toJSON: (data) => {
    try {
      return { object: JSON.parse(data) };
    } catch(e) {
      return { error: e.message };
    }
  },
  asObject: (object, type) => {
    if(ReplOutputType[type]) {
      return ReplOutputType[type](object);
    }
  },
  accessError: (e) => {
    return (
      <span className='read-error'>
        [[Get Error]] {ReplOutputType[typeof e](e)}
      </span>);
  },
  transformObject: (object) => {
    try {
      return ReplOutputType[typeof object](object);
    } catch(e) {
      return ReplOutput.accessError(e);
    }
  },
  readProperty: (obj, prop) => {
    try {
      return obj && obj[prop];
    } catch(e) {
      return ReplOutput.accessError(e);
    }
  },
  source: (mod) => {
    //const context = ReplContext.getContext();
    return (
      <div/>
    );
  },

  transpile: (output) => {
    const html = ReplCommon.highlight(output, 'js', true);
    return <ReplOutputTranspile html={html} output={output} />
  }
};

export default ReplOutput;
