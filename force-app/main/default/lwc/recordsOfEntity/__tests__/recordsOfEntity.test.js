import { createElement } from "lwc";

import recordsOfEntity from "c/recordsOfEntity";

import getRelatedChildRecords from "@salesforce/apex/CrossReferencesAPI.getRelatedChildRecords";
import getRelatedParentRecords from "@salesforce/apex/CrossReferencesAPI.getRelatedParentRecords";
import getParentRecordCount from "@salesforce/apex/CrossReferencesAPI.getParentRecordCount";
import getChildRecordCount from "@salesforce/apex/CrossReferencesAPI.getChildRecordCount";

import { NUMBER_OF_RECORDS_PER_PAGE } from "c/utils";

import flushPromises from "flush-promises";

const APEX_RECORDLIST_SUCCESS = require("./data/recordListSuccess.json");
const APEX_RECORDCOUNT_SUCCESS = require("./data/recordCountSuccess.json");

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getRelatedChildRecords",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getRelatedParentRecords",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getParentRecordCount",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getChildRecordCount",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("Unit tests for recordsDisplay.js", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-records-of-entity", {
      is: recordsOfEntity
    });

    getRelatedChildRecords.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getRelatedParentRecords.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getParentRecordCount(APEX_RECORDCOUNT_SUCCESS);
    getChildRecordCount(APEX_RECORDCOUNT_SUCCESS);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("Ensure that records are successfully displayed", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: "5",
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);
    await flushPromises();

    const arrayOfrecordDiv = element.shadowRoot.querySelectorAll(".record");
    expect(arrayOfrecordDiv.length).toBe(APEX_RECORDLIST_SUCCESS.length);
    arrayOfrecordDiv.forEach((recordDiv, index) => {
    const nameDiv = recordDiv.querySelector(".recordName");
    expect(nameDiv.textContent).toBe(APEX_RECORDLIST_SUCCESS[index].Name);
    const nameFieldDiv = recordDiv.querySelector(".nameField");
    expect(nameFieldDiv.textContent).toBe(element.entityDetails.NameField);
    });
  });

  it("Ensure that accordion is hidden when no records are found", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: "0",
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);
    await flushPromises();

    const accordionElement = element.shadowRoot.querySelector("lightning-accordion");
    expect(accordionElement).toBeNull();
  });


  it("Ensure that accordion label contains entity name, relationship type and number of records", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: "5",
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);

    await flushPromises();
    const accordionElement = element.shadowRoot.querySelector(
    "lightning-accordion-section"
    );
    expect(accordionElement.label).toBe(`${element.entityDetails.Name} (${element.entityDetails.RelationshipType}) - ${element.entityDetails.NumberOfRecords} record${element.entityDetails.NumberOfRecords == 1 ? "" : "s"}`);
    expect(NUMBER_OF_RECORDS_PER_PAGE).toBe(5);
  });

  it("Ensure that pagination buttons are displayed", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: NUMBER_OF_RECORDS_PER_PAGE + 1,
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);
    await flushPromises();

    const paginitationButtonsDiv = element.shadowRoot.querySelector(".paginationButtons");
    expect(paginitationButtonsDiv).toBeTruthy();
    
  });

  it("Ensure that pagination buttons are hidden when there is only one page of records", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: NUMBER_OF_RECORDS_PER_PAGE,
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);
    await flushPromises();

    const paginitationButtonsDiv =element.shadowRoot.querySelector(".paginationButtons");
    expect(paginitationButtonsDiv).toBeNull();
  });

  it("Ensure that pagination buttons work as intended", async () => {
    element.entityDetails = {
      Name: "Opportunity",
      RelationshipType: "Look up",
      NameField: "Name",
      NumberOfRecords: NUMBER_OF_RECORDS_PER_PAGE+1,
      TypeOfEntity: "child"
    };
    element.recordId = "001Iw000002MIZ4IAO";
    document.body.appendChild(element);
    await flushPromises();

    //Ensure that next button works changes page.
    const nextButton =element.shadowRoot.querySelector(".nextButton");
    nextButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    let pageNumberSpan = element.shadowRoot.querySelector(".pageNumber");
    expect(pageNumberSpan.textContent).toBe('Page 2 of 2');

    //Ensure that previous button changes page.
    const previousButton =element.shadowRoot.querySelector(".previousButton");
    previousButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();
    
    expect(pageNumberSpan.textContent).toBe('Page 1 of 2');
});


});
