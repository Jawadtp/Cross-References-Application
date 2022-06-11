@isTest
private class CrossReferencesAPITest
{
    @isTest
    static void testIsObjectCustom()
    {
        Boolean result = CrossReferencesAPI.isObjectCustom('Property__c');
        System.assertEquals(true, result);

        result = CrossReferencesAPI.isObjectCustom('Account');
        System.assertEquals(false, result);

        result = CrossReferencesAPI.isObjectCustom('..InvalidObject..');
        System.assertEquals(false, result);

    }

    @isTest
    static void testGetObjectAPINameFromId()
    {
        Account acc = new Account(Name = 'Sample Name');
        insert acc;
        String name = CrossReferencesAPI.getObjectAPINameFromId(acc.Id);
        System.assertEquals('Account', name);

        String invalidIdResult = CrossReferencesAPI.getObjectAPINameFromId('1234');
        System.assertEquals(null, invalidIdResult);

        String recordNotFound = CrossReferencesAPI.getObjectAPINameFromId('001Iw00ZZZZZZZZZZZ'); // Record with this ID will never get created. This, however, is a valid ID.
        System.assertEquals(null, recordNotFound);


    }


    @isTest
    static void testGetNameField()
    {
        String accountNameField = CrossReferencesAPI.getNameField('Account');
        String caseNameField = CrossReferencesAPI.getNameField('Case');
        String invalidAccountNameField = CrossReferencesAPI.getNameField('..InvalidObject..');
        System.assertEquals('Name', accountNameField);
        System.assertEquals('CaseNumber', caseNameField);
        System.assertEquals(null ,invalidAccountNameField);

    }


    
     
    @isTest
    static void testGetRecordById()
    {
        Account acc = new Account(Name='Sample Name');
        insert acc;

        Map<String, String> result = CrossReferencesAPI.getRecordById(acc.Id);

        Map<String, String> expected = new Map<String, String>{
            'Name'=>acc.Name,
            'Id'=>String.valueOf(acc.Id),
            'NameField'=>'Name'
        };
        System.assertEquals(expected, result);

        Map<String, String> resultInvalidId = CrossReferencesAPI.getRecordById('1234');
        System.assertEquals(null, resultInvalidId);

        Map<String, String> resultRecordNotFound = CrossReferencesAPI.getRecordById('001Iw00ZZZZZZZZZZZ');
        System.assertEquals(null, resultRecordNotFound);

    }


    @IsTest
    static void testGetRelatedParentRecords()
    {
        Account acc = new Account(Name='Sample Account');
        Contact con = new Contact(FirstName='Sample', LastName='Name');
        insert new List<SObject>{acc, con};
        
        Case cas = new Case(AccountId=acc.Id, ContactId=con.id);
        insert cas;


        System.debug('ID of case: ' + cas.Id);
        List<Map<String,String>> parentRecords  = CrossReferencesAPI.getRelatedParentRecords(cas.Id, 'Account', '', 1, 0);


        Map<String, String> expectedResult = new Map<String, String>{
            'Name'=>'Sample Account',
            'Id'=>String.valueOf(acc.Id)
        };

        // Ensure that parent records are fetched when parent records are present.
        System.assertEquals(1, parentRecords.size());
        System.assertEquals(expectedResult, parentRecords[0]);

        List<Map<String,String>> parentRecords_WithSearch  = CrossReferencesAPI.getRelatedParentRecords(cas.Id, 'Account', 'z', 1, 0);

        // Ensure that parent records are correctly fetched when a search key is specified.
        System.assertEquals(0, parentRecords_WithSearch.size());

        // Ensure that no records are fetched when an invalid object name is passed.
        List<Map<String,String>> parentRecords_InvalidObjectName  = CrossReferencesAPI.getRelatedParentRecords(cas.Id, '*InvalidObject*', '', 1, 0);
        System.assertEquals(0 , parentRecords_InvalidObjectName.size());
    }


    @isTest
    static void testGetRelatedChildRecords()
    {
        Account acc = new Account(Name='Sample Account');
        insert acc;
        
        Contact con1 = new Contact(FirstName='Tom', LastName='Harry', AccountId=acc.Id);
        Contact con2 = new Contact(FirstName='Derek', LastName='Star', AccountId=acc.Id);
        Contact con3 = new Contact(FirstName='Mac', LastName='Dillian', AccountId=acc.Id);
        insert new List<SObject>{con1, con2, con3};
        
        List<Map<String, String>> childRecords = CrossReferencesAPI.getRelatedChildRecords(acc.Id, 'Contact', '', 5, 0);

        Map<String,String> expectedResult = new Map<String, String>{
            'Name' => 'Tom Harry',
            'Id' => con1.Id
        };

        // Ensure that records are fetched when no search key is specified.
        System.assertEquals(3, childRecords.size());
        System.assertEquals(expectedResult, childRecords[0]);

        // Ensure that records are fetched when a search key is specified.
        List<Map<String, String>> childRecords_WithSearch = CrossReferencesAPI.getRelatedChildRecords(acc.Id, 'Contact', 'r', 5, 0);
        System.assertEquals(2, childRecords_WithSearch.size());

        // Ensure that empty array is returned when an invalid object name is specified.
        List<Map<String, String>> childRecords_InvalidObjectName = CrossReferencesAPI.getRelatedChildRecords(acc.Id, '*InvalidName*', 'r', 5, 0);
        System.assertEquals(0, childRecords_InvalidObjectName.size());

    }


    @isTest
    static void testGetChildEntityDetails()
    {

        // Ensure that entityDetails are fetched for all entities that have child records to the record with the passed record id.
        Account acc = new Account(Name='Sample Account');
        insert acc;

        Contact con = new Contact(FirstName='Tom', LastName='Harry', AccountId=acc.Id);
        Opportunity opp = new Opportunity(Name='Express Logistics', StageName='Prospecting', CloseDate=Date.valueOf('2020-04-13'), AccountId=acc.Id);
        Case cas = new Case(AccountId=acc.Id);
        insert new List<SObject>{con, opp, cas};

        List<Map<String, String>> childEntityDetails = CrossReferencesAPI.getChildEntityDetails(acc.Id);


        Map<String, String> expectedResult = new Map<String, String>{
            'Name' =>'Contact',
            'RelationshipType' => 'Look up',
            'NameField' =>'Name',
            'NumberOfRecords' => '1',
            'TypeOfEntity' => 'child'
        };


        Map<String, String> actualResult=null;

        for(Map<String, String> entityDetails: childEntityDetails)
        {
            if(entityDetails.get('Name')=='Contact')
            {
                actualResult=entityDetails;
                break;
            }
        }

        System.assertEquals(3, childEntityDetails.size());
        System.assertEquals(expectedResult, actualResult);

        // Ensure that entityDetails are not fetched when no child records of the respective entity are present.
        Account acc_NoChildren = new Account(Name='Sample Account 1');

        insert acc_NoChildren;

        List<Map<String, String>> childEntityDetails_NoChildren = CrossReferencesAPI.getChildEntityDetails(acc_NoChildren.Id);
        System.assertEquals(0, childEntityDetails_NoChildren.size());


    }

    //public static List<Map<String, String>> getParentEntityDetails(Id recordId)

    // ToDo: Fix this method. Insert a contact with no parents and check on the app and ull see
    @isTest
    static void testGetParentEntityDetails()
    {
        // Ensure that entityDetails are fetched for all entities that have parent records to the record with the passed record id.
        Account acc = new Account(Name='Sample Account');
        Contact con = new Contact(FirstName='Tom', LastName='Harry');
        insert new List<sObject>{acc, con};
        Case cas = new Case(AccountId=acc.Id, ContactId=con.Id);
        insert cas;

        List<Map<String, String>> parentEntityDetails = CrossReferencesAPI.getParentEntityDetails(cas.Id);

        Map<String, String> expectedResult = new Map<String, String>{
            'Name' =>'Contact',
            'RelationshipType' => 'Look up',
            'NameField' =>'Name',
            'NumberOfRecords' => '1',
            'TypeOfEntity' => 'parent'
        };

        Map<String, String> actualResult=null;

        for(Map<String, String> entityDetails: parentEntityDetails)
        {
            if(entityDetails.get('Name')=='Contact')
            {
                actualResult=entityDetails;
                break;
            }
        }

        System.assertEquals(expectedResult, actualResult);
        
        // Ensure that entityDetails are not fetched when no parent records of the respective entity are present.
        Contact con1 = new Contact(FirstName='Jonathan', LastName='Dorathy');
        insert con1;
        List<Map<String, String>> parentEntityDetails_NoParents = CrossReferencesAPI.getParentEntityDetails(con.Id);
        System.debug(parentEntityDetails_NoParents);
        System.assertEquals(0, parentEntityDetails_NoParents.size());

    }

 //   public static Integer getChildRecordCount(Id recordId, String childObjectName, String searchKey)

    @isTest
    static void testGetChildRecordCount()
    {

        Account acc = new Account(Name='Sample Account');
        insert acc;
        Contact con1 = new Contact(FirstName='Tom', LastName='Harry', AccountId=acc.Id);
        Contact con2 = new Contact(FirstName='Derek', LastName='Star', AccountId=acc.Id);
        Contact con3 = new Contact(FirstName='Mac', LastName='Dillian', AccountId=acc.Id);    
        insert new List<SObject>{con1, con2, con3};

        // Ensure that child record count fetched is correct when there are child records.
        Integer childRecordCount = CrossReferencesAPI.getChildRecordCount(acc.Id, 'Contact', '');
        System.assertEquals(3, childRecordCount);

        // Ensure that child record count fetched is correct when a search key is specified.
        Integer childRecordCount_WithSearchKey = CrossReferencesAPI.getChildRecordCount(acc.Id, 'Contact', 'r');
        System.assertEquals(2, childRecordCount_WithSearchKey);

        // Ensure that child record count fetched is correct when there are no child records.
        Account acc1 = new Account(Name='Sample Account 1');
        insert acc1;
        Integer childRecordCount_NoChildRecords = CrossReferencesAPI.getChildRecordCount(acc1.Id, 'Contact', '');
        System.assertEquals(0, childRecordCount_NoChildRecords);

        // Ensure that a null value is returned when an invalid object name is entered.
        Integer childRecordCount_InvalidObjectName = CrossReferencesAPI.getChildRecordCount(acc.Id, '*InvalidObjectName*', '');
        System.assertEquals(null,childRecordCount_InvalidObjectName);
    }

    @isTest
    static void testGetParentRecordCount()
    {
        Account acc = new Account(Name='Sample Account');
        insert acc;
        Contact con1 = new Contact(FirstName='Tom', LastName='Harry', AccountId=acc.Id);
        Contact con2 = new Contact(FirstName='Derek', LastName='Star');
        insert new List<SObject>{con1, con2};

        // Ensure that parent record count fetched is correct when a parent is present.
        Integer parentRecordCount = CrossReferencesAPI.getParentRecordCount(con1.id, 'Account', '');
        System.assertEquals(1, parentRecordCount);

         // Ensure that parent record count fetched is correct when a search key is specified.
         Integer parentRecordCount_WithSearchKey = CrossReferencesAPI.getParentRecordCount(con1.id, 'Account', 'ccount');
         System.assertEquals(1, parentRecordCount_WithSearchKey);

        // Ensure that parent record count fetched is correct (zero) when no parent is present.
        Integer parentRecordCount_NoParentRecords = CrossReferencesAPI.getParentRecordCount(con2.id, 'Account', '');
        System.assertEquals(0, parentRecordCount_NoParentRecords);

        // Ensure that a null value is returned when an invalid object name is entered.
        Integer parentRecordCount_InvalidObjectName = CrossReferencesAPI.getParentRecordCount(con1.id, '*InvalidObjectName*', '');
        System.assertEquals(null, parentRecordCount_InvalidObjectName);

    }

}
