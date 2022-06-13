import { LightningElement, api } from 'lwc';

export default class RecordsOfEntity extends LightningElement 
{
    @api entityDetails;
    @api recordId;
    @api searchKey;

}