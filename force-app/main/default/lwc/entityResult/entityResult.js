import { LightningElement, api, track } from 'lwc';
import getParents from "@salesforce/apex/CrossReferencesAPI.getParents";
import getChildren from "@salesforce/apex/CrossReferencesAPI.getChildren";

export default class EntityResult extends LightningElement 
{
    inputText=''

    @track
    parents=[]

    @track
    children=[]

    
    get isDataFetched()
    {
        return this.parents.length || this.children.length;
    }

    handleInputChange(event)
    {
        this.inputText = event.target.value;
    }

    async onSubmitClick()
    {
        const parentData = await getParents({objectName: this.inputText})
        const childData = await getChildren({objectName: this.inputText})

        this.parents=parentData
        this.children=childData
    }

    
    

    
}