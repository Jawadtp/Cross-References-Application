import { createElement } from 'lwc';

import recordResult from 'c/recordResult';

import getChildRecords from "@salesforce/apex/CrossReferencesAPI.getChildRecords";
import getParentRecords from "@salesforce/apex/CrossReferencesAPI.getParentRecords";
import getRecordById from "@salesforce/apex/CrossReferencesAPI.getRecordById";

const APEX_CURRENTRECORD_SUCCESS = require('./data/currentRecordSuccess.json')
const APEX_RECORDLIST_SUCCESS = require('./data/recordListSuccess.json')

jest.mock('@salesforce/apex/CrossReferencesAPI.getChildRecords', 
() => ({
    default: jest.fn()
}), {virtual: true})
  
jest.mock('@salesforce/apex/CrossReferencesAPI.getParentRecords', 
() => ({
    default: jest.fn()
}), {virtual: true})

jest.mock('@salesforce/apex/CrossReferencesAPI.getRecordById', 
() => ({
    default: jest.fn()
}), {virtual: true})


describe('Unit tests for recordResult.js', () => {

  afterEach(() => {
    while(document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });
    
  it('Test to ensure current record is displayed correctly', () => 
  {
    getRecordById.mockResolvedValue(APEX_CURRENTRECORD_SUCCESS);
    getChildRecords.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getParentRecords.mockResolvedValue(APEX_RECORDLIST_SUCCESS);

    const element = createElement('c-record-result', {
        is: recordResult
      });
     
  
      document.body.appendChild(element);


      return Promise.resolve().then(() => {
        const nameFieldDiv = element.shadowRoot.querySelector('.nameField');
        expect(nameFieldDiv.textContent).toBe(APEX_CURRENTRECORD_SUCCESS.Name);
      });

   

  });

  
});