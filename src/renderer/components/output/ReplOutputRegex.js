import React from 'react';
import _ from 'lodash';
import ReplDOM from './ReplDOM';

export default class ReplOutputRegex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      input: ''
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onHighlight = this.onHighlight.bind(this);
    this.bindObjectToContext = this.bindObjectToContext.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  componentDidMount() {
    this.element = React.findDOMNode(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  onHighlight() {
    const re = this.props.regex;
    const replacer = (match) => {
      return match.length ? `<span class='matched'>${match}</span>` : '<span></span>';
    };
    return this.state.input.replace(re, replacer);
  }

  onKeyUp(e) {
    if(e.shiftKey) { return; }
    const playGround = this.element.querySelector('.repl-regex-play-ground');
    this.state.input = playGround.innerText;
    const cursor = ReplDOM.getCursorPositionRelativeTo(playGround);
    const output = this.onHighlight();
    playGround.innerHTML = output;
    ReplDOM.setCursorPositionRelativeTo(cursor, playGround);
  }

  bindObjectToContext() {
//    ReplActions.bindObjectToContext(this.props.regex, ReplOutput.transformObject(this.props.regex));
  }

  render() {
    return (
      <span className='repl-regex-fold'>
        {
          this.state.collapse
            ? <span className='repl-regex'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                <span className='cm-string-2'>{this.props.regex.toString()}</span>
              </span>
            : <span className='repl-regex'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                <span className='cm-string-2'>{this.props.regex.toString()}</span>
                <i className='fa fa-hashtag' title='Store as Global Variable' onClick={this.bindObjectToContext}></i>
                {
                  <div className='repl-regex-play-ground' placeholder='Test regex here'
                    onKeyUp={this.onKeyUp}
                    tabIndex="-1" contentEditable={true}
                    dangerouslySetInnerHTML={{__html:this.onHighlight()}}>
                  </div>
                }
              </span>
        }
      </span>
    );
  }
}
