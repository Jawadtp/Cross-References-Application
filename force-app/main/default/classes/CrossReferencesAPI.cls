public with sharing class CrossReferencesAPI 
{   
    // This set contains child entities that are common to most entities (hence doesn't make sense to display them).
    private static Set<String> entityIgnoreList = new Set<String> 
    {
        'AIInsightValue',
        'AIRecordInsight',
        'ActivityRecurrence2',
        'ActivityRecurrence2Exception',
        'AttachedContentDocument',
        'Attachment',
        'CollabDocumentMetricRecord',
        'CollabTemplateMetricRecord',
        'CollabUserEngmtRecordLink',
        'CollaborationGroupRecord',
        'CombinedAttachment',
        'ContactRequest',
        'ContentDistribution',
        'ContentDocumentLink',
        'ContentVersion',
        'DuplicateRecordItem',
        'EmailMessage',
        'EmailMessageChangeEvent',
        'EntitySubscription',
        'Event',
        'EventChangeEvent',
        'EventRelationChangeEvent',
        'FeedComment',
        'FeedItem',
        'FinanceBalanceSnapshot',
        'FinanceBalanceSnapshotChangeEvent',
        'FinanceTransaction',
        'FinanceTransactionChangeEvent',
        'FlowExecutionErrorEvent',
        'FlowOrchestrationWorkItem',
        'FlowRecordRelation',
        'Note',
        'NoteAndAttachment',
        'OpenActivity',
        'OutgoingEmail',
        'ProcessException',
        'ProcessExceptionEvent',
        'ProcessInstance',
        'ProcessInstanceHistory',
        'RecordAction',
        'RecordActionHistory',
        'TaskChangeEvent',
        'TopicAssignment'
    };
    
    // Returns a list of the API names of all custom objects in the org. 
    @AuraEnabled
    public static List<String> getCustomObjectAPINames()
    {    
        List<String> objectNames = new List<String>();
        
        List<Schema.SObjectType> objList = Schema.getGlobalDescribe().Values();     
        for(Schema.SObjectType obj : objList)
        {
            if(obj.getDescribe().isCustom())
                objectNames.add(obj.getDescribe().getName());
        }
        
        return objectNames;
    }

    
    //Returns the list of all parent entities (both look up and master-detail) for the entity with the specified API name.
    @AuraEnabled
    public static List<Map<String, String>> getParents(String objectName)
    {
        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
                
        List<Map<String, String>> parents = new List<Map<String, String>>();

        Set<String> parentNames = new Set<String>(); //Parent names as they are encountered are added to this set. If the same parent count is encountered again, it is ignored to avoid duplicate results.

        for(Schema.SobjectField field: objectType.getDescribe().fields.getMap().Values())
        {
            if(field.getDescribe().getType() == Schema.DisplayType.REFERENCE) //Field is a parent.
            {
                String parentName = String.valueOf(field.getDescribe().getReferenceTo());

                if(parentName.contains('Group,') || parentNames.contains(parentName)) // (Group, User) is not a separate entity. 
                    continue;

                parentNames.add(parentName); //Parent name is added to the set if it has never been encountered earlier in the loop.

                parentName = parentName.substring(1, parentName.length()-1); //Parent name is returned in the format (name). () are removed.

                
                Integer relationshipOrder = field.getDescribe().getRelationshipOrder(); 
                
                String relationshipType = relationshipOrder==null?'Look up':'Master-Detail'; //Relationship order is null for look up. It is 0 or 1 for master-detail.
                
                 Map<String, String> item = new Map<String, String>{'Name' => parentName, 'RelationshipType' => relationshipType, 'Id' => String.valueOf(parents.size())};
                
                 parents.add(item);
            }
        }
        return parents; // List of {Name, RelationshipType, Id}
                        // Example: [{Name: 'Account', RelationshipType: 'Master-Detail', Id: '12345678'}, {...}, ...]

    }

    // Returns the list of all child entities (both look up and master-detail) for the entity with the specified API name.
    @AuraEnabled
    public static List<Map<String, String>> getChildren(String objectName)
    {
        List<Map<String, String>> children = new List<Map<String, String>>();
        Set<String> childNames = new Set<String>();

        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult R = objectType.getDescribe(); 
        List<Schema.ChildRelationship> C = R.getChildRelationships();
        
        for( Schema.ChildRelationship cr :c) // Looping through all child entities (both look up and master-detail)
        {
            String childName = String.valueOf(cr.getChildSObject());

            if(childNames.contains(childName) || entityIgnoreList.contains(childName)) // If the entity name is already added or is in the ignore list, skip.
                continue;
            
            childNames.add(childName);

            Map<String, String> item = new Map<String, String>{'Id'=>String.valueOf(children.size()), 'Name'=>childName};
            
            if(cr.isCascadeDelete() && cr.getField().getDescribe().getRelationshipOrder()!=null) // Checking only cascade-delete property results in false positives. For instance, Account-Contact have cascade-delete set to true although they have a look up relationship. 
            { 
                item.put('RelationshipType', 'Master-Detail');
            }
            else item.put('RelationshipType', 'Look up');

            children.add(item);
        }
        return children; // List of {Name, RelationshipType, Id}
                        // Example: [{Name: 'Account', RelationshipType: 'Master-Detail', Id: '12345678'}, {...}, ...]
    }


   
    // Fetch details for the record with the given record ID.
    @AuraEnabled
    public static Map<String, String> getRecordById(Id recordId)
    {
        String objectAPIName = recordId.getSObjectType().getDescribe().getName();
        Map<String, String> recordDetails = new Map<String, String>();
        String nameField = getNameField(objectAPIName);
        
        try
        {
            String query = String.format('SELECT ID, {0} FROM {1} WHERE ID={2} LIMIT 1', new List<String>{nameField, objectAPIName, '\''+recordId+'\''});
            SObject record = Database.query(query);
            recordDetails.put('Name', String.valueOf(record.get(nameField)));
            recordDetails.put('Id', String.valueOf(record.get('id')));
            recordDetails.put('NameField', nameField);
            return recordDetails;        
        }
        catch(Exception e)
        {
            System.debug(e);
            return null;
        }
    }


    // Fetches the meta data of all parent entities of the passed record that have at least one record as a parent record to the passed record. 
    @AuraEnabled
    public static List<Map<String, String>> getParentEntityDetails(Id recordId)
    {
        List<Map<String, String>> parentEntities = new List<Map<String, String>>();
        String objectAPIName = getObjectAPINameFromId(recordId); // objectAPIName is null for invalid record IDs.
        
        if(objectAPIName==null) 
            throw new AuraHandledException('Invalid ID');
        
        SObjectType objectType = Schema.getGlobalDescribe().get(objectAPIName);
        Set<String> parentNames = new Set<String>();
        
        for(Schema.SobjectField field: objectType.getDescribe().fields.getMap().Values())
        {
            if(field.getDescribe().getType() == Schema.DisplayType.REFERENCE)
            {
                String parentName = String.valueOf(field.getDescribe().getReferenceTo());                                      
                parentName = parentName.Substring(1, parentName.length()-1); // Parent name is returned in the format (name). () are removed.     
                String nameField = getNameField(parentName);
                
                if(nameField==null || parentName==objectAPIName || parentNames.contains(parentName))
                    continue;
                
                parentNames.add(parentName);

                Integer relationshipOrder = field.getDescribe().getRelationshipOrder();          
                String relationshipType = relationshipOrder==null?'Lookup':'Master-Detail';                
                
                String parentNameModified=parentName;

                if(field.getDescribe().isCustom())
                    parentNameModified=parentName.substring(0, parentName.length()-1)+'r'; // For custom objects, while querying parent name must contain __r.
                        
                try
                {
                    String query = String.format('SELECT COUNT({0}.id) FROM {1} WHERE ID = {2}', new List<String>{parentNameModified, objectAPIName, '\''+recordId+'\'', parentNameModified, '\'' + '%' + 'null' + '%' + '\''}); 
                    System.debug(query);
                    SObject queryResult = Database.query(query);
                    Integer numberOfRecords = Integer.valueOf(queryResult.get('expr0'));
                    if(numberOfRecords>0)
                    {
                        Map<String, String> parentEntity = new Map<String, String>{
                            'Name' => parentName,
                            'RelationshipType' => relationshipType,
                            'NameField' => nameField,
                            'NumberOfRecords'=> String.valueOf(numberOfRecords),
                            'TypeOfEntity'=> 'parent'

                        };
                        parentEntities.add(parentEntity);
                    }
                }
                catch(Exception e)
                {
                    System.debug(e);
                }
                
            }
        }
        return parentEntities; // Parents is a map from (parentName, relationshipType, nameField) -> records.
        // Example: ('Account, Master-Detail, Name': [acc1, acc2, acc3, ... ]);
        
    }

    @AuraEnabled
    public static List<Map<String, String>> getChildEntityDetails(Id recordId)
    {
        List<Map<String, String>> childEntities = new List<Map<String, String>>();

        String objectAPIName = recordId.getSObjectType().getDescribe().getName();

        SObjectType objectType = Schema.getGlobalDescribe().get(objectAPIName);
        DescribeSObjectResult describeResult = objectType.getDescribe();

        for (ChildRelationship childRelation : describeResult.getChildRelationships()) 
        {
            
            if(childRelation.getChildSObject().getDescribe().isQueryable()) // Not every child object is queryable.
            {
                String typeOfRelation = childRelation.isCascadeDelete() && childRelation.getField().getDescribe().getRelationshipOrder()!=null?'Master-Detail':'Look up';
                List<Map<String, String>> childList = new List<Map<String, String>>();
                String childObjectName = String.valueOf(childRelation.getChildSObject());
                if(entityIgnoreList.contains(childObjectName))
                    continue;
                String nameField='';
                
                for(SObjectField field :childRelation.getChildSObject().getDescribe().fields.getMap().values())
                {
                    DescribeFieldResult describe  = field.getDescribe();
                    if(describe.isNameField())
                        nameField = describe.getName();
                }
                
                if(nameField=='')
                    continue;
                String query = String.format('SELECT COUNT({0}) FROM {1} WHERE {2} = {3}', new List<String>{nameField, childObjectName, String.valueOf(childRelation.getField()), +'\''+String.valueOf(recordId)+'\''});
                System.debug(query);
                try
                {
                    SObject queryResult = Database.query(query);
                    Integer numberOfRecords = Integer.valueOf(queryResult.get('expr0'));
                    
                    if(numberOfRecords>0)
                    {
                        Map<String, String> childEntity = new Map<String, String>{
                            'Name' => childObjectName,
                            'RelationshipType' => typeOfRelation,
                            'NameField' => nameField,
                            'NumberOfRecords'=> String.valueOf(numberOfRecords),  
                            'TypeOfEntity'=> 'child'
                        };
                        childEntities.add(childEntity);
                    }
        
                }
                catch(Exception e)
                {
                    System.debug(e);
                }
            }
            
        }

        return childEntities; // Children is a map from (childName, relationshipType, nameField) -> records.
        // Example: ('Account, Master-Detail, Name': [acc1, acc2, acc3, ... ]);

    }

    // Returns the list of all parent records of entity type objectAPIName for the record with the specified ID. 
    @AuraEnabled
    public static List<Map<String, String>> getRelatedParentRecords(Id recordId, String objectAPIName, String searchKey, Integer numberOfRecords, Integer pageNumber)
    {
        List<Map<String, String>> parents = new List<Map<String, String>>();
        String childObjectAPIName = recordId.getSObjectType().getDescribe().getName();
        String nameField = getNameField(objectAPIName);
        
        if(isObjectCustom(objectAPIName))
            objectAPIName = objectAPIName.replace('__c', '__r');
        String queryPartForSearch = '';
        if(searchKey.length() > 0) // There is a search key.
            queryPartForSearch = 'AND ' + objectAPIName + '.' + nameField + ' LIKE ' + '\'' + '%' + searchKey + '%' + '\''; // This part needs to be included in the query string to facilitate search.
        
        String query = String.format('SELECT {0}.ID, {1}.{2}, ID FROM {3} WHERE ID={4} {5} LIMIT {6} OFFSET {7}', new List<String>{objectAPIName, objectAPIName, nameField, childObjectAPIName, '\'' + recordId + '\'', queryPartForSearch, String.valueOf(numberOfRecords), String.valueOf(pageNumber*numberOfRecords)});
        try
        {
            System.debug('Query: ' + query);
            List<SObject> parentRecords = Database.query(query);
            for(SObject parentRecord: parentRecords)
            {
                parentRecord = parentRecord.getSObject(objectAPIName);
                Map<String, String> parentRecordMap = new Map<String, String>();
                parentRecordMap.put('Name', String.valueOf(parentRecord.get(nameField)));
                parentRecordMap.put('Id', parentRecord.Id);
                parents.add(parentRecordMap);
            }
        }
        catch(Exception e)
        {
            System.debug(e);
        }
        return parents;
    }

    //Return the list of all child records of the specified objectAPIName type for a record whose ID is given. Filter by searchkey and pagination supported.
    @AuraEnabled
    public static List<Map<String, String>> getRelatedChildRecords(Id recordId, String objectAPIName, String searchKey, Integer numberOfRecords, Integer pageNumber)
    {
        List<Map<String, String>> children = new List<Map<String, String>>();
        String parentObjectAPIName = recordId.getSObjectType().getDescribe().getName();
        String nameField = getNameField(objectAPIName);
        String queryPartForSearch = '';
        
        String modifiedParentObjectAPIName=parentObjectAPIName;
        
        if(isObjectCustom(parentObjectAPIName))
            modifiedParentObjectAPIName=parentObjectAPIName.substring(0, parentObjectAPIName.length()-1)+'r'; // For custom objects, while querying parent name must contain __r.

        if(searchKey.length() > 0) // There is a search key.
            queryPartForSearch = 'AND ' + nameField + ' LIKE ' + '\'' + '%' + searchKey + '%' + '\'';
        
        String query = String.format('SELECT ID, {0} FROM {1} WHERE {2}.ID ={3} {4} LIMIT {5} OFFSET {6}', new List<String>{nameField, objectAPIName, modifiedParentObjectAPIName,  '\'' + recordId + '\'', queryPartForSearch, String.valueOf(numberOfRecords), String.valueOf(pageNumber*numberOfRecords)});
        
        try
        {
            System.debug('Query: ' + query);
            List<SObject> childRecords = Database.query(query);
            for(SObject childRecord: childRecords)
            {
                Map<String, String> childRecordMap = new Map<String, String>();
                childRecordMap.put('Name', String.valueOf(childRecord.get(nameField)));
                childRecordMap.put('Id', childRecord.Id);
                children.add(childRecordMap);
            }
        }
        catch(Exception e)
        {
            System.debug(e);
        }
        return children;
    }

    // Returns the number of child records of type childObjectName for the given parent record ID whose names contain the specified search key.
    @AuraEnabled
    public static Integer getChildRecordCount(Id recordId, String childObjectName, String searchKey)
    {
        String objectAPIName = recordId.getSObjectType().getDescribe().getName();
        String nameField = getNameField(childObjectName);
        String query = String.format('SELECT COUNT(ID) FROM {0} WHERE {1}.ID = {2} AND {3} LIKE {4}', new List<String>{childObjectName, objectAPIName, '\'' + recordId + '\'', nameField, '\'' + '%' + searchKey + '%' + '\''});
        System.debug(query); 
        
        try
        {
            SObject result = Database.query(query);
            Integer numberOfRecords = Integer.valueOf(result.get('expr0'));
            return numberOfRecords;
        }
        catch(Exception e)
        {
            return null;
        }
        
    }

    // Returns the number of parent records of type parentObjectName for the given child record ID whose names contain the specified search key.
    @AuraEnabled
    public static Integer getParentRecordCount(Id recordId, String parentObjectName, String searchKey)
    {
        String objectAPIName = getObjectAPINameFromId(recordId); // objectAPIName is null for invalid record IDs.
        
        if(objectAPIName==null) 
            throw new AuraHandledException('Invalid ID');
        
        String nameField = getNameField(parentObjectName);
        

        String query = String.format('SELECT COUNT({0}.id) FROM {1} WHERE ID = {2} AND {3}.{4} LIKE {5}', new List<String>{parentObjectName, objectAPIName, '\''+recordId+'\'', parentObjectName, nameField, '\'' + '%' + searchKey + '%' + '\''}); 
        System.debug(query);
        try
        {
            SObject queryResult = Database.query(query);
            Integer numberOfRecords = Integer.valueOf(queryResult.get('expr0'));
            return numberOfRecords;
        }
        catch(Exception e)
        {
            return null;
        }
                    
    }

    // Fetch the API name of the name field of the entity with the specified API name. Every object in Salesforce has a name field although the API name of the field may be different.
    static String getNameField(String objectAPIName)
    {
        String nameFieldQuery = 'SELECT QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName ='+'\''+objectAPIName+'\''  +'AND IsNameField = TRUE LIMIT 1';
        try
        {
            SObject nameFieldObject= Database.query(nameFieldQuery);
            String nameField = String.valueOf(nameFieldObject.get('QualifiedApiName'));
            return nameField;
        }
        catch(Exception e)
        {
            System.debug('Exception for '+objectAPIName);
            System.debug(e);
            return null;
        }
    
    }

    // Fetch the API name of the entity of which the record with the passed record ID is an instance.
    static String getObjectAPINameFromId(Id recordId)
    {
        try 
        {
            String name = recordId.getSObjectType().getDescribe().getName();
            return name;

        } catch (Exception e) 
        {
            return null;    
        }
    }

    // A straightforward way to check if an object is custom without invoking any Schema Namespace functions.
    static Boolean isObjectCustom(String objectAPIName)
    {
        return objectAPIName.substring(objectAPIName.length()-3)=='__c';     
    }

}