import React from 'react';
import {EOL} from 'os';
import ReplCommon from './ReplCommon';
import ReplConstants from './ReplConstants';
import _ from 'lodash';
import JsLogo from "renderer/assets/images/js.png"

export default class ReplOutputTranspile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
    };
    this.onToggleCollapse = this.onToggleCollapse.bind(this);

    const lines = this.props.output.trim().split(EOL);
    if(lines.length > 1 || lines[0].length > ReplConstants.COMMAND_TRUNCATE_LENGTH){
      this.shortEntry = ReplCommon.highlight(lines[0].slice(0, ReplConstants.COMMAND_TRUNCATE_LENGTH));
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  render() {
    return (
      <div className='repl-entry-message-output'>
        {
          this.shortEntry
            ? this.state.collapse
                ? <span className='repl-entry-message-output-function'>
                    <i className='fa fa-plus-square-o' onClick={this.onToggleCollapse}></i>
                    <img className='es-img' src={JsLogo} title='ES(transpiled)'/>
                    <span dangerouslySetInnerHTML={{__html:this.shortEntry}}></span>
                  </span>
                : <span className='repl-entry-message-output-function'>
                    <i className='fa fa-minus-square-o' onClick={this.onToggleCollapse}></i>
                    <img className='es-img' src={JsLogo} title='ES(transpiled)'/>
                    <span dangerouslySetInnerHTML={{__html:this.props.html}}></span>
                  </span>
            : <span className='repl-entry-message-output-function'>
                <img className='es-img' src={JsLogo} title='ES(transpiled)'/>
                <span dangerouslySetInnerHTML={{__html:this.props.html}} />
              </span>
        }
      </div>
    );
  }
}
