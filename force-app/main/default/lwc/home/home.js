import { LightningElement, track } from 'lwc';




export default class Home extends LightningElement 
{

    inputText='';

    @track parents={}
    @track children={}

    showResult=false;

    value = 'entity';

    connectedCallback()
    {

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

    test(event)
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
       console.log('Submit clicked')
    }


}