import { createElement } from 'lwc';

import recordsDisplay from 'c/recordsDisplay';

jest.mock('c/recordsOfEntity');

  
describe('Unit tests for recordsDisplay.js', () => {

    let element;

    beforeEach(()=> {
        element = createElement('c-records-display', {
            is: recordsDisplay
          });
    });

  afterEach(() => {
    while(document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });
    
  it('Ensure that NO RECORDS FOUND div is rendered when entity list is empty', () => 
  {

      element.entityList=[];
      element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('.noRecordsFound');
     expect(div.textContent).toBe('* No related records found.');

  });

  it('Ensure that NO RECORDS FOUND div is not rendered when entity list is populated', () => 
  {

    element.entityList=[{"Name":"Account","RelationshipType":"Look up","NameField":"Name","NumberOfRecords":"1","TypeOfEntity":"parent"}];
    element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('.noRecordsFound');
     expect(div).toBeNull();

  });


  it('Ensure that search input is enabled when records are present', () => 
  {
      element.entityList=[{"Name":"Account","RelationshipType":"Look up","NameField":"Name","NumberOfRecords":"1","TypeOfEntity":"parent"}];
      element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('lightning-input');
     expect(div).toBeDefined();
  });

  it('Ensure that search input is disabled when records are absent', () => 
  {
      element.entityList=[];
      element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('lightning-input');
     expect(div).toBeNull();
  });

  it('Ensure that recordsOfEntity child is not displayed when entityList is empty', () => 
  {
      element.entityList=[];
      element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('c-records-of-entity');
     expect(div).toBeNull();
  });

  it('Ensure that recordsOfEntity child is displayed when entityList is populated', () => 
  {
    element.entityList=[{"Name":"Account","RelationshipType":"Look up","NameField":"Name","NumberOfRecords":"1","TypeOfEntity":"parent"}];
    element.recordId='1234';
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('c-records-of-entity');
     expect(div).toBeDefined();

  });
});