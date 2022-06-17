import { LightningElement, api} from 'lwc';
import { SEARCH_WAIT_INTERVAL, RECORD_COUNT_FOR_SEARCH  } from 'c/utils';

export default class RecordsDisplay extends LightningElement 
{
    @api entityList;

    @api
    get recordId() 
    {
        return this._recordId;
    }
    set recordId(value) 
    {
        this.setAttribute('recordId', value);
        this._recordId = value;
        this.resetSearchInput();
    }

    _recordId;
    inputText = '';
    searchKey = '';
    timeout=null;

    resetSearchInput()
    {
        this.inputText = '';
        this.searchKey = '';
    }

    handleSearchInputChange(event)
    {
        this.inputText=event.target.value;
        clearTimeout(this.timeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.timeout = setTimeout(() => {
            this.searchKey = this.inputText;
            console.log('Searching for', this.searchKey);
          }, SEARCH_WAIT_INTERVAL);
    }

    onRecordClick(event)
    {
        this.resetSearchInput();
        const recordId = event.detail;
        const recordClickEvent = new CustomEvent('fetchrelatedrecords', { detail: recordId });
        this.dispatchEvent(recordClickEvent);
    }

    get isRelatedRecordsEmpty()
    {
        return this.entityList.length===0;
    }

    get showSearchRecords()
    {
        let totalNumberOfRecords = 0;
        this.entityList.forEach((entity)=>{
            totalNumberOfRecords+=parseInt(entity.NumberOfRecords, 10);
        });
        return totalNumberOfRecords>=RECORD_COUNT_FOR_SEARCH;
    }

}