import { createElement } from "lwc";
import flushPromises from "flush-promises";
import recordResult from "c/recordResult";
import { ShowToastEventName } from "lightning/platformShowToastEvent";

import getChildEntityDetails from "@salesforce/apex/CrossReferencesAPI.getChildEntityDetails";
import getParentEntityDetails from "@salesforce/apex/CrossReferencesAPI.getParentEntityDetails";
import getRecordById from "@salesforce/apex/CrossReferencesAPI.getRecordById";

const APEX_CURRENTRECORD_SUCCESS = require("./data/currentRecordSuccess.json");
const APEX_CURRENTRECORD_ERROR = require("./data/currentRecordError.json");

const APEX_RECORDLIST_SUCCESS = require("./data/recordListSuccess.json");

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getChildEntityDetails",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getParentEntityDetails",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/CrossReferencesAPI.getRecordById",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock("c/recordsDisplay");

describe("Unit tests for recordResult.js", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-record-result", {
      is: recordResult
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("Test to ensure current record is displayed correctly", async () => {
    getChildEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getRecordById.mockResolvedValue(APEX_CURRENTRECORD_SUCCESS);
    getParentEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);

    document.body.appendChild(element);

    const recordIdInput = element.shadowRoot.querySelector("lightning-input");
    recordIdInput.value = APEX_CURRENTRECORD_SUCCESS.Id;
    recordIdInput.dispatchEvent(new CustomEvent("change"));
    await flushPromises();

    const submitButton = element.shadowRoot.querySelector("lightning-button");
    submitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    const nameFieldDiv = element.shadowRoot.querySelector(".nameField");
    const recordNameDiv = element.shadowRoot.querySelector(".recordName");
    expect(nameFieldDiv.textContent).toBe(APEX_CURRENTRECORD_SUCCESS.NameField);
    expect(recordNameDiv.textContent).toBe(APEX_CURRENTRECORD_SUCCESS.Name);
  });

  it("Test to ensure that result clear button works properly.", async () => {
    getChildEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getRecordById.mockResolvedValue(APEX_CURRENTRECORD_SUCCESS);
    getParentEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);

    document.body.appendChild(element);

    const recordIdInput = element.shadowRoot.querySelector("lightning-input");
    recordIdInput.value = APEX_CURRENTRECORD_SUCCESS.Id;
    recordIdInput.dispatchEvent(new CustomEvent("change"));
    await flushPromises();

    const submitButton = element.shadowRoot.querySelector("lightning-button");
    submitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    const exitButton = element.shadowRoot.querySelector(".exitButton");
    exitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    const resultDiv = element.shadowRoot.querySelector(
      ".recordResultOuterWrapper"
    );
    expect(resultDiv).toBeNull(); // Check that result container is no longer shown.
  });

  it("Ensure that recordsDisplay is displayed for both child and parent entities", async () => {
    getChildEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);
    getRecordById.mockResolvedValue(APEX_CURRENTRECORD_SUCCESS);
    getParentEntityDetails.mockResolvedValue(APEX_RECORDLIST_SUCCESS);

    document.body.appendChild(element);

    const recordIdInput = element.shadowRoot.querySelector("lightning-input");
    recordIdInput.value = APEX_CURRENTRECORD_SUCCESS.Id;
    recordIdInput.dispatchEvent(new CustomEvent("change"));
    await flushPromises();

    const submitButton = element.shadowRoot.querySelector("lightning-button");
    submitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    const parentRecordsDisplayDiv = element.shadowRoot.querySelector(".parentRecords");
    expect(parentRecordsDisplayDiv.textContent.trim()).toBe("Parent records");
    const recordsDisplayComponentParent = element.shadowRoot.querySelector( ".parentRecords c-records-display");
    expect(recordsDisplayComponentParent).toBeTruthy();
    const childRecordsDisplayDiv = element.shadowRoot.querySelector(".childRecords");
    expect(childRecordsDisplayDiv.textContent.trim()).toBe("Child records");
    const recordsDisplayComponentChild = element.shadowRoot.querySelector(".childRecords c-records-display");
    expect(recordsDisplayComponentChild).toBeTruthy();

    
  });

  it("Test to ensure that error is handled", async () => {
    const TOAST_TITLE = "Invalid record ID";
    const TOAST_MESSAGE = "No record could be found with the entered record ID";
    const TOAST_VARIANT = "error";

    getChildEntityDetails.mockResolvedValue(APEX_CURRENTRECORD_ERROR);
    getRecordById.mockResolvedValue(APEX_CURRENTRECORD_ERROR);
    getParentEntityDetails.mockResolvedValue(APEX_CURRENTRECORD_ERROR);

    document.body.appendChild(element);

    const handler = jest.fn();

    element.addEventListener(ShowToastEventName, handler);

    const recordIdInput = element.shadowRoot.querySelector("lightning-input");
    recordIdInput.value = "1234"; //Invalid ID
    recordIdInput.dispatchEvent(new CustomEvent("change"));
    await flushPromises();

    const submitButton = element.shadowRoot.querySelector("lightning-button");
    submitButton.dispatchEvent(new CustomEvent("click"));
    await flushPromises();

    expect(handler).toHaveBeenCalled(); // Ensure that error message is show with a toast event.
    expect(handler.mock.calls[0][0].detail.title).toBe(TOAST_TITLE);
    expect(handler.mock.calls[0][0].detail.message).toBe(TOAST_MESSAGE);
    expect(handler.mock.calls[0][0].detail.variant).toBe(TOAST_VARIANT);
  });
});
