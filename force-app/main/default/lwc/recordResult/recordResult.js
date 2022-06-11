import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


import getRecordById from "@salesforce/apex/CrossReferencesAPI.getRecordById";
import getChildEntityDetails from  "@salesforce/apex/CrossReferencesAPI.getChildEntityDetails";
import getParentEntityDetails from '@salesforce/apex/CrossReferencesAPI.getParentEntityDetails';

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

   onClearResultClick()
   {
       console.log('Cleared');
       this.children=this.parents=[];
       this.isDataFetched=false;
   }


    getRecordListFromAPIData(data)
    {
        var records = [];

        for(let objectMetaData of Object.keys(data))
        {
            const objectMetaDataList = objectMetaData.split(',');
            records.push({Name: objectMetaDataList[0],  RelationshipType: objectMetaDataList[1], NameField: objectMetaDataList[2], Records: data[objectMetaData]})
        }

        return records;
    }

   fetchClickedRecord(event)
    {
        console.log('Record click reached recordResult, ID ', event.detail);

        this.inputText=event.detail;
        this.fetchRecords();
    }

    async fetchRecords()
    {
        this.isIdInvalid=false;

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
            
            console.log('child records: ', JSON.stringify(childData));
            console.log('parent records: ', JSON.stringify(parentData));
            console.log('Current record details: ', JSON.stringify(currentRecordDetails));


        }
        catch(e)
        {
            this.showSpinner=false; 
            console.error(JSON.stringify(e));
            const evt = new ShowToastEvent({
                title: 'Invalid record ID',
                message: 'No record could be found with the entered record ID',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        console.log('Parent data: ', JSON.stringify(parentData))
     
        this.children = childData;
        this.parents = parentData;
       this.currentRecordDetails = currentRecordDetails;


        this.isDataFetched=true;

        this.showSpinner=false; 
    }

    onSubmitClick()
    {
       this.fetchRecords();
       
    }

}