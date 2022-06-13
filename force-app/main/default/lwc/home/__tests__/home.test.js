import { createElement } from 'lwc';
import getCustomObjectAPINames from "@salesforce/apex/CrossReferencesAPI.getCustomObjectAPINames";
const APEX_APINAMESLIST_ERROR = require('./data/apiNamesError.json');
const APEX_APINAMESLIST_SUCCESS = require('./data/apiNamesSuccess.json')
import home from 'c/home';


jest.mock('@salesforce/apex/CrossReferencesAPI.getCustomObjectAPINames', 
() => ({
    default: jest.fn()
}), {virtual: true})
  
describe('Unit tests for home.js', () => {

  afterEach(() => {
    while(document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });
    
  it('Testing text content when server returns data', () => 
  {
    getCustomObjectAPINames.mockResolvedValue(APEX_APINAMESLIST_SUCCESS);

    const element = createElement('c-home', {
        is: home
      });
     
  
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('.radioGroupLabel');
     expect(div.textContent).toBe('What do you want to obtain cross references for?');
  });

  it('Testing text content when server error occurs', () => 
  {
    getCustomObjectAPINames.mockResolvedValue(APEX_APINAMESLIST_ERROR);

    const element = createElement('c-home', {
        is: home
      });
     
  
      document.body.appendChild(element);
     const div = element.shadowRoot.querySelector('.radioGroupLabel');
     expect(div.textContent).toBe('What do you want to obtain cross references for?');
  });

  

});