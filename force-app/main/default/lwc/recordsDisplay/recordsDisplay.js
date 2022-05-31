import { LightningElement, api } from 'lwc';

export default class RecordsDisplay extends LightningElement 
{
    @api relatedRecords;

    get isRelatedRecordsEmpty()
    {
        return this.relatedRecords.length==0;
    }

    onRecordClick(event)
    {
        const recordId = event.currentTarget.getAttribute('data-item');
        const recordClickEvent = new CustomEvent('fetchrelatedrecords', { detail: recordId });
        this.dispatchEvent(recordClickEvent);
        console.log('Clicked record id: ', recordId);
    }
}