import React from 'react';
import _ from 'lodash';
import ReplCommon from './ReplCommon';

const sentinalValues = _.map(new Array(0x10), () => 0);

export default class ReplOutputBufferExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
    }
    _.each([
      'getGridHeaderOffsets', 'getASCIIOffsets', 'getGridData', 'getGridRowData',
      'getGridRowOffset', 'onPreviousPage', 'onNextPage', 'hasNextPage', 'hasPreviousPage',
      'onChangePage', 'gotoPage'
    ], (field) => {
      this[field] = this[field].bind(this);
    });

    this.buffer = ReplCommon.toArray(this.props.buffer).concat(sentinalValues);
    this.rXc = this.props.buffer.length;
    this.rows = ((this.rXc / 0x10) | 0) + ((this.rXc % 0x10) > 0 ? 1 : 0);
    this.pages = ((this.rows / 0x10) | 0) + ((this.rows % 0x10) > 0 ? 1 : 0);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(_.isEqual(nextState, this.state) && _.isEqual(nextProps, this.props));
  }

  getGridHeaderOffsets() {
    const labels = [
      '00', '01', '02', '03', '04', '05', '06', '07',
      '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'
    ];
    return _.map(labels, (label) => <span className='offset-pos'>{label}</span>);
  }

  getASCIIOffsets() {
    return _.map(new Array(16), (l) => <span className='offset-ascii-pos'> </span>);
  }

  getGridRowOffset(row) {
    return (row * 0x10).toString(0x10);
  }

  getGridRowData(row) {
    const rowKey = `row-${row}`;
    const start = row * 0x10;
    const end = start + 0x10;
    const dataSet = this.buffer.slice(start, end);

    const toHexString = (code) => {
      const val = `0${code.toString(0x10).toUpperCase()}`;
      return val.slice(val.length - 2);
    };

    const getClazz = (clazz, printable, idx) => {
      const pos = row * 0x10 + idx;
      const gridLength = this.props.buffer.length;
      return `${clazz} ${!printable ? 'mask' : ''} ${row % 2 == 0 ? 'even' : 'odd'} ${pos < gridLength ? 'in' : 'out'}`;
    };

    return (
      <div className='data-buffer-grid-row' key={rowKey}>
        <span className='offset'>{this.getGridRowOffset(row)}</span>
        {
          _.map(dataSet, (l, idx) => <span className={getClazz('offset-pos', true, idx)}>{toHexString(l)}</span>)
        }
        {
          _.map(dataSet, (l, idx) => {
            const char = String.fromCharCode(l);
            const isPrintable = ReplCommon.isPrintableAscii(char);
            const clazz = getClazz('offset-ascii-pos', isPrintable, idx);
            return <span className={clazz}>{isPrintable ? char : '.'}</span>
          })
        }
      </div>
    );
  }

  getGridData() {
    const results = [];
    const start = (this.state.page - 1) * 0x10;
    const end = start + (this.hasNextPage()
      ? 0x10 : (((this.rXc % 0x100) / 0x10) | 0) + ((this.rXc % 0x10) > 0 ? 1 : 0));

    for(let r = start; r < end; r += 1) {
      results.push(this.getGridRowData(r));
    }
    return results;
  }

  onChangePage(offset) {
    this.setState({
      page: this.state.page + offset
    });
  }

  onPreviousPage() {
    this.onChangePage(-1);
  }

  onNextPage() {
    this.onChangePage(1);
  }

  hasNextPage() {
    return this.pages > this.state.page;
  }

  hasPreviousPage() {
    return this.state.page > 1;
  }

  gotoPage(e) {
    const page = parseInt(e.target.value, 10);
    if(page > 0 && page <= this.pages) {
      this.setState({
        page: page
      })
    };
  }

  render() {
    const gridData = this.getGridData();
    const caretLeftClazz = `fa fa-caret-left ${this.hasPreviousPage() ? '' : 'disabled'}`;
    const caretRightClazz = `fa fa-caret-right ${this.hasNextPage() ? '' : 'disabled'}`;

    return (
      <div className='repl-output-data-buffer-explorer'>
        <div className='data-buffer-grid-header'>
          <span className='offset'>Offset</span>
          {this.getGridHeaderOffsets()}
          {this.getASCIIOffsets()}
        </div>
        <div className='data-buffer-grid-body'>
          {gridData}
        </div>
        <div className='data-buffer-grid-pagination'>
          <span className='placeholder'></span>
          <i className={caretLeftClazz} title='Previous Page' onClick={this.onPreviousPage}></i>
          {this.state.page}/{this.pages}
          <span className='textbox'>
            <input type="number" name="page-number" title="Goto Page" value={this.state.page} min="1" max={this.pages} onChange={this.gotoPage} />
          </span>
          <i className={caretRightClazz} title='Next Page' onClick={this.onNextPage}></i>
          <span className='placeholder'></span>
        </div>
      </div>
    );
  }
}
