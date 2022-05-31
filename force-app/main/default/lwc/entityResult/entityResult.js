import { LightningElement, api, track } from 'lwc';
import getParents from "@salesforce/apex/CrossReferencesAPI.getParents";
import getChildren from "@salesforce/apex/CrossReferencesAPI.getChildren";

export default class EntityResult extends LightningElement 
{
    inputText='';

    showSpinner=false;

    @track
    parents=[];

    @track
    children=[];

    @api
    customObjectApiNames;

    connectedCallback()
    {
        console.log('API Names: ', JSON.stringify(this.customObjectApiNames));
    }

    get getPlaceholderText()
    {
        return this.customObjectApiNames.length>0?'Select custom object API name..':'Fetching custom object API names..';
    }
    
    get isDataFetched()
    {
        return this.parents.length || this.children.length;
    }

    handleChange(event)
    {
        this.inputText=event.detail.value;
    }
    
    handleInputChange(event)
    {
        this.inputText = event.target.value;
    }

    async fetchRelatedEntities()
    {
        this.showSpinner=true;

        const parentData = await getParents({objectName: this.inputText});
        const childData = await getChildren({objectName: this.inputText});

        this.parents=parentData;
        this.children=childData;

        this.showSpinner=false;
    }
    
    onSubmitClick()
    {
        this.fetchRelatedEntities();
    }

    
    

    
}