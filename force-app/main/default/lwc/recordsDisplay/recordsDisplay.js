import { LightningElement, api, track } from 'lwc';

export default class RecordsDisplay extends LightningElement 
{

    inputText = '';
    searchKey = '';
    timeout=null;
    @track activeSections = [];

    @api entityList;
    @api recordId;

    connectedCallback()
    {
        this.initialiseActiveSections();
        console.log('recordsDisplay called for entities: ' + JSON.stringify(this.entityList));
    }

    initialiseActiveSections()
    {
        let activeSections = [];
        this.entityList.forEach((entity)=> {
            activeSections.push(entity.Name);
        });
        Promise.resolve().then(() => {
            this.activeSections=activeSections;
        });
    }

    handleSearchInputChange(event)
    {
        this.inputText=event.target.value;
        clearTimeout(this.timeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.timeout = setTimeout(() => {
            this.searchKey = this.inputText;
            console.log('Searching for', this.searchKey);
          }, 1000);

    }

    handleSearchButton()
    {
        this.searchKey=this.inputText;
    }

    onRecordClick(event)
    {
        
        console.log('Record click reached recordsDisplay, ID ', event.detail);
        this.inputText='';
        this.searchKey='';
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
        return this.entityList.length>0;
    }

}