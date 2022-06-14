import { createElement } from "lwc";
import flushPromises from "flush-promises";
import getParents from "@salesforce/apex/CrossReferencesAPI.getParents";
import getChildren from "@salesforce/apex/CrossReferencesAPI.getChildren";

const APEX_ENTITYLIST_SUCCESS = require("./data/entityListSuccess.json");

import entityResult from "c/entityResult";

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getParents",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getChildren",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("Unit tests for entityResult.js", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-entity-result", {
      is: entityResult
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("Test to ensure that combobox indicates that objectApiNames are loading when they are being fetched from the server", () => {
    getParents.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);
    getChildren.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);

    element.customObjectApiNames = [];

    document.body.appendChild(element);
    const comboboxElement =
      element.shadowRoot.querySelector("lightning-combobox");
    expect(comboboxElement.placeholder).toBe(
      "Fetching custom object API names.."
    );
    expect(comboboxElement.options.length).toBe(0);
  });

  it("Test to ensure that combobox lists objectApiNames once they are loaded from the server", () => {
    getParents.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);
    getChildren.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);

    element.customObjectApiNames = [
      "Broker__c",
      "Property__c",
      "Task__c",
      "Student__c",
      "Offer__c",
      "Favorite__c",
      "Car__c",
      "Person__c",
      "Bike__c"
    ];

    document.body.appendChild(element);
    const comboboxElement =
      element.shadowRoot.querySelector("lightning-combobox");
    expect(comboboxElement.placeholder).toBe("Select custom object API name..");
    expect(comboboxElement.options.length).toBe(9);
  });

  it("Test to ensure that entityGraphicalDisplay is not displayed unless submit button is clicked", () => {
    getParents.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);
    getChildren.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);

    element.customObjectApiNames = [
      "Broker__c",
      "Property__c",
      "Task__c",
      "Student__c",
      "Offer__c",
      "Favorite__c",
      "Car__c",
      "Person__c",
      "Bike__c"
    ];

    document.body.appendChild(element);
    const entityGraphicalDisplayElement = element.shadowRoot.querySelector(
      "c-entity-graphical-display"
    );
    expect(entityGraphicalDisplayElement).toBeNull();
  });

  it("Test to ensure that entityGraphicalDisplay is displayed only when submit has been clicked", async () => {
    getParents.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);
    getChildren.mockResolvedValue(APEX_ENTITYLIST_SUCCESS);

    element.customObjectApiNames = [
      "Broker__c",
      "Property__c",
      "Task__c",
      "Student__c",
      "Offer__c",
      "Favorite__c",
      "Car__c",
      "Person__c",
      "Bike__c"
    ];

    document.body.appendChild(element);
    const comboboxElement =
      element.shadowRoot.querySelector("lightning-combobox");
    comboboxElement.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: "Property__c"
        }
      })
    );
    await flushPromises();

    const submitButton = element.shadowRoot.querySelector("lightning-button");
    submitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    const entityGraphicalDisplayElement = element.shadowRoot.querySelector(
      "c-entity-graphical-display"
    );
    expect(entityGraphicalDisplayElement).toBeTruthy();
  });


});
