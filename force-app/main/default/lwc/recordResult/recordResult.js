import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getChildRecords from "@salesforce/apex/CrossReferencesAPI.getChildRecords";
import getParentRecords from "@salesforce/apex/CrossReferencesAPI.getParentRecords";
import getRecordById from "@salesforce/apex/CrossReferencesAPI.getRecordById";

export default class RecordResult extends LightningElement 
{
    inputText='';

    isDataFetched=false;

    showSpinner=false;


    @track
    children=[];

    @track 
    parents=[];

    @track 
    currentRecordDetails;

    handleInputChange(event)
    {
        this.inputText=event.target.value;
    }

    onRecordClick(event)
    {
        const recordId = event.currentTarget.getAttribute('data-item');
        console.log('PRESSED: ', recordId);
        this.inputText=recordId;
        this.fetchRecords();
        
    }

   onClearResultClick(event)
   {
       console.log('Cleared');
       this.children=this.parents=[];
       this.isDataFetched=false;
   }


    getRecordListFromAPIData(data)
    {
        var records = [];

        for(var objectMetaData of Object.keys(data))
        {
            const objectMetaDataList = objectMetaData.split(',');
            records.push({Name: objectMetaDataList[0],  RelationshipType: objectMetaDataList[1], NameField: objectMetaDataList[2], Records: data[objectMetaData]})
        }

        return records;
    }

   fetchClickedRecord(event)
    {
        console.log('Here ', event.detail);
        this.inputText=event.detail;
        this.fetchRecords();
    }

    async fetchRecords()
    {
        this.isIdInvalid=false;

        this.inputText = this.inputText.trim();
        if(this.inputText=='')
            return;

        this.showSpinner=true;

        let childData;
        let parentData;
        let currentRecordDetails;
        try
        {
            childData = await getChildRecords({recordId: this.inputText});
            parentData = await getParentRecords({recordId: this.inputText});
            currentRecordDetails = await getRecordById({recordId: this.inputText});
        }
        catch(e)
        {
            this.showSpinner=false; 
            const evt = new ShowToastEvent({
                title: 'Invalid record ID',
                message: 'No record could be found with the entered record ID',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        console.log('Parent data: ', JSON.stringify(parentData))
     
        this.children = this.getRecordListFromAPIData(childData);
        this.parents = this.getRecordListFromAPIData(parentData);
       this.currentRecordDetails = currentRecordDetails;

        console.log('Records are: ',this.children);

        this.isDataFetched=true;

        this.showSpinner=false; 
    }

    onSubmitClick()
    {
       this.fetchRecords();
       
    }

}