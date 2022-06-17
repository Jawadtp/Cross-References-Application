import { LightningElement, api, track } from 'lwc';
import getParents from "@salesforce/apex/CrossReferencesAPI.getParents";
import getChildren from "@salesforce/apex/CrossReferencesAPI.getChildren";

export default class EntityResult extends LightningElement 
{
    @api
    customObjectApiNames;

    @track
    parents=[];

    @track
    children=[];

    currentEntity='';
    inputText='';
    showSpinner=false;

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

    onSubmitClick()
    {
        this.fetchRelatedEntities();
    }

    isEntityCustom(entityName)
    {
        for(let i=0; i<this.customObjectApiNames.length; i++)
            if(this.customObjectApiNames[i].value===entityName)
                return true;

        return false;
    }

    fetchDetailsForEntity(event)
    {
        const entityName = event.detail;

        if(this.isEntityCustom(entityName.trim()))
        {
            this.inputText=entityName;
            this.fetchRelatedEntities();
        }
        
    }

    async fetchRelatedEntities()
    {
        this.showSpinner=true;
        this.currentEntity=this.inputText;

        this.parents=this.children=[];

        const parentData = await getParents({objectName: this.inputText});
        const childData = await getChildren({objectName: this.inputText});

        this.parents=parentData;
        this.children=childData;

        this.showSpinner=false;
    }
    
}