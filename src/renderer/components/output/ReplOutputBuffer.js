import React from 'react';
import _ from 'lodash';
import ReplOutput from './ReplOutput';
import ReplCommon from './ReplCommon';
import ReplOutputObject from './ReplOutputObject';
import ReplOutputHTML from './ReplOutputHTML';
import ReplOutputBufferExplorer from './ReplOutputBufferExplorer'
import {ipcRenderer} from 'electron';


export default class ReplOutputBuffer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true,
      explorerCollapse: true,
      imageCollapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onToggleExplorerCollapse = this.onToggleExplorerCollapse.bind(this);
    this.onDownload = this.onDownload.bind(this);
    this.bindObjectToContext = this.bindObjectToContext.bind(this);

    if(this.props.image) {
      const img = document.createElement('img');
      const {type, base64} = this.props.image;
      img.src = `data:${type};base64,${base64}`;
      img.title = type.replace('image/', '');
      this.body = document.createElement('body');
      this.body.appendChild(img);
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

  onToggleExplorerCollapse() {
    this.setState({
      explorerCollapse: !this.state.explorerCollapse
    });
  }

  onDownload() {
    ipcRenderer.send('application:download', this.props.buffer);
  }

  bindObjectToContext() {
//    ReplActions.bindObjectToContext(this.props.buffer, ReplOutput.transformObject(this.props.buffer));
  }

  render() {
    const label = ReplCommon.highlight(` Buffer (${this.props.buffer.length} bytes) {}`);
    return (
      <span className='repl-entry-message-output-object-folds'>
        {
          this.state.collapse
          ? <span className='repl-entry-message-output-object'>
              <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
              <i className='fa fa-download' onClick={this.onDownload}> </i>
              { this.props.image ? <ReplOutputHTML body={this.body}/> : null }
            </span>
          : <span className='repl-entry-message-output-object'>
              <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
              <i className='fa fa-download' onClick={this.onDownload}> </i>
              <i className='fa fa-hashtag' title='Store as Global Variable' onClick={this.bindObjectToContext}></i>
              { this.props.image ? <ReplOutputHTML body={this.body}/> : null }
              <span className='object-rec'>
              {
                <div className='object-entry' key='data'>
                  {this.props.buffer.length ? '0 - ' + this.props.buffer.length : '0'}
                  <span className='object-colon'>: </span>
                  {ReplOutput.transformObject(ReplCommon.toArray(this.props.buffer))}
                </div>
              }
              {
                <div className='object-entry' key='length'>
                  length
                  <span className='object-colon'>: </span>
                  <span className='number'>{this.props.buffer.length} </span>
                </div>
              }
              {
                this.props.buffer.__proto__
                ?  <div className='object-entry' key='prototype'>
                      __proto__
                      <span className='object-colon'>: </span>
                      <ReplOutputObject object={Object.getPrototypeOf(this.props.buffer)} primitive={false}/>
                  </div>
                : null
              }
              {
                this.props.buffer.length
                  ? this.state.explorerCollapse
                    ? <span className='repl-output-buffer-explorer-container'>
                        <i className='fa fa-plus-square-o' onClick={this.onToggleExplorerCollapse}></i>
                        <span className='data-explorer-label'>Data Explorer</span>
                      </span>
                    : <span className='repl-output-buffer-explorer-container'>
                        <i className='fa fa-minus-square-o' onClick={this.onToggleExplorerCollapse}></i>
                        <span className='data-explorer-label'>Data Explorer</span>
                        <ReplOutputBufferExplorer buffer={this.props.buffer}/>
                      </span>
                  : null
              }
              </span>
            </span>
        }
      </span>
    );
  }
}
