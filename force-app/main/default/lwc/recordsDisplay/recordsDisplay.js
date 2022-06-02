import { LightningElement, api, track } from 'lwc';

export default class RecordsDisplay extends LightningElement 
{
    //@api relatedRecords;
    @track _relatedRecords;
    @track activeSections=[];
    @track relatedRecordsActive=[];

    relatedRecordsOriginal;

    @api
    get relatedRecords() 
    {
        return this._relatedRecords;
    }
    set relatedRecords(value) 
    {
        this.setAttribute('relatedRecords', value);
        this._relatedRecords = value;
        this.setup();
    }
   
    setup()
   {
        let relatedRecordsActive=[];
        let activeSections=[]; 
        this._relatedRecords.forEach((record)=> 
        {
            activeSections.push(record.Name);
            relatedRecordsActive.push({...record, AccordionDisplayName: record.Name + ' (' + record.RelationshipType+') - ' + record.Records.length + ' record' + (record.Records.length===1?'':'s')});
        });
       this.activeSections=activeSections;
        this.relatedRecordsActive=relatedRecordsActive;
        this.relatedRecordsOriginal=relatedRecordsActive;
        console.log(this.relatedRecordsActive)
        console.log('Active sections: ', JSON.stringify(this.activeSections));
   }   
   
    get isRelatedRecordsEmpty()
    {
        return this._relatedRecords.length==0;
    }
   
    get showSearchRecords()
    {
        if(this._relatedRecords.length>0)
            return true;
        return false;
    }

    handleSearchInputChange(event)
    {   
        const searchKey = event.target.value.toLowerCase();;

        if(searchKey!=='')
        {
            let filteredRecords = [];

            this._relatedRecords.forEach((groupOfRecords)=> 
            {
                let recordsInGroup = [];

                groupOfRecords.Records.forEach((record)=>{
                     if(record.Name.toLowerCase().includes(searchKey))
                         recordsInGroup.push(record);
                });


                if(recordsInGroup.length>0)
                {
                    if(this.activeSections.indexOf(groupOfRecords.Name) === -1) this.activeSections.push(groupOfRecords.Name);
                    filteredRecords.push({...groupOfRecords, Records: recordsInGroup, AccordionDisplayName:  groupOfRecords.Name + ' (' + groupOfRecords.RelationshipType+') - ' + recordsInGroup.length + ' record' + (recordsInGroup.length===1?'':'s')});
                }
            });
           
            this.relatedRecordsActive = filteredRecords;
        }
        else
        {
            console.log('Empty search query. Displaying everything..');
            this.relatedRecordsActive=this.relatedRecordsOriginal;
        }

        console.log('Active sections: ' + this.activeSections);

    }

    onRecordClick(event)
    {
        this.hasRendered=false;
        const recordId = event.currentTarget.getAttribute('data-item');
        const recordClickEvent = new CustomEvent('fetchrelatedrecords', { detail: recordId });
        this.dispatchEvent(recordClickEvent);
        console.log('Clicked record id: ', recordId);
    }
}