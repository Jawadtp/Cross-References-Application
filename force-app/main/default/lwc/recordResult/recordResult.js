import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


import getRecordById from "@salesforce/apex/CrossReferencesAPI.getRecordById";
import getChildEntityDetails from  "@salesforce/apex/CrossReferencesAPI.getChildEntityDetails";
import getParentEntityDetails from '@salesforce/apex/CrossReferencesAPI.getParentEntityDetails';

export default class RecordResult extends LightningElement 
{
    inputText='';
    recordId='';
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

   onClearResultClick()
   {
       console.log('Cleared');
       this.children=this.parents=[];
       this.isDataFetched=false;
   }

   fetchClickedRecord(event)
    {
        this.inputText=event.detail;
        this.recordId=event.detail;
        this.fetchRecords();
    }

    async fetchRecords()
    {
        this.inputText = this.inputText.trim();
        if(this.inputText==='')
            return;

        this.showSpinner=true;

        let childData;
        let parentData;
        let currentRecordDetails;
        try
        {
            childData = await getChildEntityDetails({recordId: this.inputText});
            parentData = await getParentEntityDetails({recordId: this.inputText});
            currentRecordDetails = await getRecordById({recordId: this.inputText});

            if(currentRecordDetails.hasOwnProperty('ok') && !currentRecordDetails.ok || childData.hasOwnProperty('ok') && !childData.ok || parentData.hasOwnProperty('ok') && !parentData.ok)
                this.showError();
        }
        catch(e)
        {
            console.error(e);
            this.showError();
            return;
        }
     
        this.children = childData;
        this.parents = parentData;
       this.currentRecordDetails = currentRecordDetails;
        this.isDataFetched=true;
        this.showSpinner=false; 
    }

    showError()
    {
        this.showSpinner=false; 
        const evt = new ShowToastEvent({
            title: 'Invalid record ID',
            message: 'No record could be found with the entered record ID',
            variant: 'error',
        });
        this.dispatchEvent(evt);
    }

    onSubmitClick()
    {
        this.recordId=this.inputText;
        this.fetchRecords();
    }

}