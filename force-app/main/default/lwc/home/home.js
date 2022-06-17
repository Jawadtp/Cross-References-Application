import { LightningElement, track } from 'lwc';
import getCustomObjectAPINames from "@salesforce/apex/CrossReferencesAPI.getCustomObjectAPINames";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';




export default class Home extends LightningElement 
{

    inputText = '';
    error = '';
    value = 'entity';

    @track customObjectAPINames = [];

    connectedCallback()
    {
        this.fetchCustomObjectAPINames()
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

    radioSelectionChange(event)
    {
        this.value=event.detail.value
    }
    
    handleInputChange(event)
    {
        this.inputText = event.target.value;
    }

    get options() {
        return [
            { label: 'Fetch related entities', value: 'entity' },
            { label: 'Fetch related records', value: 'record' },
        ];
    }

    get showEntityResult()
    {
        return this.value==='entity';
    }
   
    get showRecordResult()
    {
        return this.value==='record';
    }

}