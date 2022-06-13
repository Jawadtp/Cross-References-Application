import { LightningElement, api } from 'lwc';

export default class RecordsDisplay extends LightningElement {
  @api recordId;
  @api entityList;
}