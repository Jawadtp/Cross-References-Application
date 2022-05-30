import { LightningElement, track } from 'lwc';
import getChildRecords from "@salesforce/apex/CrossReferencesAPI.getChildRecords";
import getParentRecords from "@salesforce/apex/CrossReferencesAPI.getParentRecords";

export default class RecordResult extends LightningElement 
{
    inputText='';

    isDataFetched=false;

    @track
    children=[];

    @track 
    parents=[];

    handleInputChange(event)
    {
        this.inputText=event.target.value;
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

    async onSubmitClick()
    {
        console.log('Id: ', this.inputText)


        const childData = await getChildRecords({recordId: this.inputText})
        const parentData = await getParentRecords({recordId: this.inputText})


        this.children = this.getRecordListFromAPIData(childData);
        this.parents = this.getRecordListFromAPIData(parentData);

        console.log('Records are: ',JSON.stringify(this.parents));

        this.isDataFetched=true;
        /*
        const result = Object.entries(childData);

        for(var i=0; i<result.length; i++)
        {
            console.log(result[i]);

        }
        //console.log('Child records: '+ result)

        */
    }

}