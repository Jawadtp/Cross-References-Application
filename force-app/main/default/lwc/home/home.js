import { LightningElement, track } from 'lwc';
import getCustomObjectAPINames from "@salesforce/apex/CrossReferencesAPI.getCustomObjectAPINames";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';




export default class Home extends LightningElement 
{

    inputText='';
    error='';

    @track parents={};
    @track children={};

    @track customObjectAPINames = [];

    
    showResult=false;

    value = 'entity';

    connectedCallback()
    {
        this.fetchCustomObjectAPINames()
    }

    get hasErrorOccured()
    {
        return this.error!=='';
    }

    async fetchCustomObjectAPINames()
    {
        let apiNames;
        
        apiNames = await getCustomObjectAPINames( );

        console.log(JSON.stringify(apiNames));
        let customObjectAPINames = [];

        if(apiNames.status===400)
        {
            this.error=apiNames.body.message;
            const evt = new ShowToastEvent({
                title: 'An error has occured',
                message: this.error,
                variant: 'error',
            });
            this.dispatchEvent(evt);
        }
        else
        {
            this.error='';
            apiNames.forEach((apiName)=>{
                customObjectAPINames.push({
                    label: apiName,
                    value: apiName
                })});
        }
        this.customObjectAPINames=customObjectAPINames;
    }

    get isDataFetched()
    {
        return Object.keys(this.parents).length !=0 //&& Object.keysw(this.children).length!=0;
    }

    
    

    get options() {
        return [
            { label: 'Fetch related entities', value: 'entity' },
            { label: 'Fetch related records', value: 'record' },
        ];
    }

    radioSelectionChange(event)
    {
        console.log(event.detail.value)
        this.value=event.detail.value
    }
    
    get showEntityResult()
    {
        return this.value==='entity';
    }
   
    get showRecordResult()
    {
        return this.value==='record';
    }
    


   
    handleInputChange(event)
    {
        this.inputText = event.target.value;
    }

    get textFieldPlaceholderText()
    {
        return this.value==='entity'?'Enter custom object API name..':'Enter record id..';
    }

     onSubmitClick()
    {
      this.showResult=true;
    }


}