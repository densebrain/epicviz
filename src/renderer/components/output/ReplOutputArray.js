import React from 'react';
import _ from 'lodash';
import ReplOutput from './ReplOutput';
import ReplOutputObject from './ReplOutputObject';
import ReplCommon from './ReplCommon';
//import ReplActions from '../actions/ReplActions';

export default class ReplOutputArray extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.getKeysButLength = this.getKeysButLength.bind(this);
    this.getArrayRecords = this.getArrayRecords.bind(this);
    this.getType = this.getType.bind(this);
    this.getPrototype = this.getPrototype.bind(this);
    this.bindObjectToContext = this.bindObjectToContext.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  getType() {
    const type = ReplCommon.type(this.props.proto);
    return ` ${type !== 'Undefined' ? type : 'Array[0]'} {}`;
  }

  getKeysButLength() {
    // cljs won't return length property since I enumerate the original container
    const keys = Object.getOwnPropertyNames(this.props.array).filter( x => x !== 'length');
    return keys.slice(0, keys.length);
  }

  getPrototype() {
    return this.props.proto ||
      (this.props.array.length &&
        this.props.array[0] &&
        this.props.array[0]._isReactElement &&
        this.props.array[0]._isReactElement.props.proto
      ) ||
      Object.getPrototypeOf(this.props.array);
  }

  getArrayRecords() {
    const continuation = this.props.label.indexOf(' … ') !== -1;
    return (
      <span className='array-rec'>
      {
        this.getKeysButLength().map((key,idx) => {
          const value = ReplOutput.readProperty(this.props.array, key);
          //const idx = parseInt(key, 10);
          return (
            <div className='array-entry' key={idx}>
              {
                this.props.noIndex || (value && value._isReactElement)
                  ? null
                  : <span className='array-idx'>
                      { this.props.start + idx}
                      <span className='array-colon'>: </span>
                    </span>
              }
              {
                value && value._isReactElement
                  ? value
                  : ReplOutput.transformObject(value)
              }
            </div>
          )
        })
      }
      {
        continuation
          ? null
          : <div className='array-entry' key='number'>
              length: <span className='number'>{this.props.length ? this.props.length : this.props.array.length}</span>
            </div>
      }
      {
        continuation
          ? null
          : <div className='array-entry' key='prototype'>
              __proto__
              <span className='array-colon'>: </span>
              <ReplOutputObject object={this.getPrototype()} label={this.getType()} primitive={false}/>
            </div>
      }
      </span>
    );
  }

  bindObjectToContext() {
//    ReplActions.bindObjectToContext(this.props.array, ReplOutput.transformObject(this.props.array));
  }

  render() {
    return (
      <span className='repl-entry-message-output-array-folds'>
        {
          this.state.collapse
            ? <span className='repl-entry-message-output-array'>
                <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
                <span className='array-desc'>{this.props.label}</span>
              </span>
            : <span className='repl-entry-message-output-array'>
                <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
                <span className='array-desc'>{this.props.label}</span>
                <i className='fa fa-hashtag' title='Store as Global Variable' onClick={this.bindObjectToContext}></i>
                {this.getArrayRecords()}
              </span>
        }
      </span>
    );
  }
}
