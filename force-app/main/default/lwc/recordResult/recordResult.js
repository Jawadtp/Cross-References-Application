import { LightningElement, track } from 'lwc';
import getChildRecords from "@salesforce/apex/CrossReferencesAPI.getChildRecords";
import getParentRecords from "@salesforce/apex/CrossReferencesAPI.getParentRecords";

export default class RecordResult extends LightningElement 
{
    inputText='';

    isDataFetched=false;

    showSpinner=false;

    @track
    children=[];

    @track 
    parents=[];

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

        if(this.inputText.trim()=='')
            return;

        this.showSpinner=true;

        const childData = await getChildRecords({recordId: this.inputText})
        const parentData = await getParentRecords({recordId: this.inputText})


        this.children = this.getRecordListFromAPIData(childData);
        this.parents = this.getRecordListFromAPIData(parentData);

        console.log('Records are: ',this.parents);

        this.isDataFetched=true;

        this.showSpinner=false;
    }

    onSubmitClick()
    {
       this.fetchRecords();
       
    }

}