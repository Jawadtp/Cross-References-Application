import { LightningElement, api, track } from 'lwc';
import getRelatedChildRecords from "@salesforce/apex/CrossReferencesAPI.getRelatedChildRecords";
import getRelatedParentRecords from "@salesforce/apex/CrossReferencesAPI.getRelatedParentRecords";
import getParentRecordCount from "@salesforce/apex/CrossReferencesAPI.getParentRecordCount";
import getChildRecordCount from "@salesforce/apex/CrossReferencesAPI.getChildRecordCount";
import { NUMBER_OF_RECORDS_PER_PAGE } from 'c/utils';


export default class RecordsOfEntity extends LightningElement 
{


    @api entityDetails;
    @api recordId;

    accordionLabel='';

    _searchKey='';

    @api
    get searchKey() 
    {
        return this._searchKey;
    }
    set searchKey(value) 
    {
        this.setAttribute('searchKey', value);
        this._searchKey = value;
        this.setup();
    }


    @track records=[];
    @track activeSections=[];
    recordsCache;

    numberOfPages=0;
    pageNumber=1;
    numberOfRecords=0;
    isLoading=true;

    connectedCallback()
    {
        this.setup();
    }

    async setup()
    {
        if(this._searchKey==='')
        {
            this.numberOfPages = Math.ceil(this.entityDetails.NumberOfRecords/NUMBER_OF_RECORDS_PER_PAGE);
            this.numberOfRecords=this.entityDetails.NumberOfRecords;
        }
        else
        {
            let numberOfRecords;
            this.isLoading=true;

            if(this.entityDetails.TypeOfEntity==='child')
                numberOfRecords = await getChildRecordCount({recordId: this.recordId, childObjectName: this.entityDetails.Name, searchKey: this._searchKey});
            
            else
                numberOfRecords = await getParentRecordCount({recordId: this.recordId, parentObjectName: this.entityDetails.Name, searchKey: this._searchKey});

            this.numberOfRecords = numberOfRecords;
            this.numberOfPages = Math.ceil(numberOfRecords/NUMBER_OF_RECORDS_PER_PAGE);
        }


        this.recordsCache = [];
        this.pageNumber=1;

        for(let i=0; i<this.numberOfPages; i++)
            this.recordsCache.push([]);

        this.fetchRecords();

        Promise.resolve().then(() => {
            this.activeSections=[this.entityDetails.Name];
        });

    }

    async fetchRecords()
    {
        this.isLoading=true;

        const parametersObject = {
            recordId: this.recordId, 
            objectAPIName: this.entityDetails.Name, 
            searchKey: this._searchKey, 
            numberOfRecords: NUMBER_OF_RECORDS_PER_PAGE, 
            pageNumber: this.pageNumber-1,
        };

        if(this.entityDetails.TypeOfEntity==='child')
            this.records = await getRelatedChildRecords(parametersObject);
        else this.records = await getRelatedParentRecords(parametersObject);
        
        if(this.records.length===0)
            this.numberOfPages=0;

        this.recordsCache[this.pageNumber-1] = this.records;

        this.isLoading=false;

        this.accordionLabel = `${this.entityDetails.Name} (${this.entityDetails.RelationshipType}) - ${this.numberOfRecords} record${this.numberOfRecords==1?'':'s'}`;

    }

    onRecordClick(event)
    {
    
        const recordId = event.currentTarget.getAttribute('data-item');
        const recordClickEvent = new CustomEvent('fetchrelatedrecords', { detail: recordId });
        this.dispatchEvent(recordClickEvent);
    }

    handleNextPageClick()
    {
        if(this.pageNumber<this.numberOfPages)
        {
            this.pageNumber=this.pageNumber+1;

            if(this.recordsCache[this.pageNumber-1].length===0)
            {
                this.fetchRecords();
            }
            else 
            {
                this.records = this.recordsCache[this.pageNumber-1];
            }
        }
    }

    handlePreviousPageClick()
    {
        if(this.pageNumber>1)
        {
            this.pageNumber=this.pageNumber-1;
            if(this.recordsCache[this.pageNumber-1].length===0)
            {
                this.fetchRecords();
            }
            else 
            {
                this.records = this.recordsCache[this.pageNumber-1];
            }
        }
    }

    handleSectionToggle()
    {
    }

    get showAccordion()
    {
        return this.numberOfPages!==0;
    }

    get showPaginationButtons()
    {
        return this.numberOfPages>1;
    }

    get disablePreviousButton()
    {
        return this.pageNumber<=1;
    }

    get disableNextButton()
    {
        return this.pageNumber>=this.numberOfPages;
    }

    get areRecordsFetched()
    {
        return this.records.length>0;
    }

}