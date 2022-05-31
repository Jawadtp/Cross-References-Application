public with sharing class CrossReferencesAPI 
{   
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

    
    @AuraEnabled
    public static List<Map<String, String>> getParents(String objectName)
    {
        System.debug('getParents called with object name: '+objectName);
        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        
        
        List<Map<String, String>> parents = new List<Map<String, String>>();

        Set<String> parentNames = new Set<String>();

        for(Schema.SobjectField field: objectType.getDescribe().fields.getMap().Values())
        {
            if(field.getDescribe().getType() == Schema.DisplayType.REFERENCE)
            {
                String parentName = String.valueOf(field.getDescribe().getReferenceTo());
                if(parentName.contains('Group,') || parentNames.contains(parentName)) // (Group, User) is not a separate entity.
                    continue;

                parentNames.add(parentName);

                parentName = parentName.Substring(1, parentName.length()-1); //parent name is returned in the format (name). () are removed.

                
                Integer relationshipOrder = field.getDescribe().getRelationshipOrder();
                String relationshipType;
                
                switch on relationshipOrder
                {
                    when null
                    {
                        relationshipType='Lookup';
                    }
                    when else
                    {
                        relationshipType='Master-Detail';
                    }
                }
                 Map<String, String> item = new Map<String, String>{'Name' => parentName, 'RelationshipType' => relationshipType, 'Id' => String.valueOf(parents.size())};
                
                 parents.add(item);
            }
        }
        return parents; 

    }

    @AuraEnabled
    public static List<Map<String, String>> getChildren(String objectName)
    {
        List<Map<String, String>> children = new List<Map<String, String>>();
        Set<String> childNames = new Set<String>();

        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult R = objectType.getDescribe(); 
        List<Schema.ChildRelationship> C = R.getChildRelationships();
        
        for( Schema.ChildRelationship cr :c)
        {
            String childName = String.valueOf(cr.getChildSObject());
            if(childNames.contains(childName) || entityIgnoreList.contains(childName))
                continue;
            
            childNames.add(childName);

            Map<String, String> item = new Map<String, String>{'Id'=>String.valueOf(children.size()), 'Name'=>childName};
            if(cr.isCascadeDelete() && cr.getField().getDescribe().getRelationshipOrder()!=null)
            { 
                item.put('RelationshipType', 'Master-Detail');
                
            }
            else item.put('RelationshipType', 'Look up');
            children.add(item);
        }
        return children;
    }

    @AuraEnabled
    public static Map<String, List<Map<String, String>>> getChildRecords(Id recordId)
    {
        Map<String, List<Map<String, String>>> children = new Map<String, List<Map<String, String>>>();
        
        String objectAPIName = recordId.getSObjectType().getDescribe().getName();

        SObjectType objectType = Schema.getGlobalDescribe().get(objectAPIName);
        DescribeSObjectResult describeResult = objectType.getDescribe();
        
        for (ChildRelationship childRelation : describeResult.getChildRelationships()) 
        {
            
            if(childRelation.getChildSObject().getDescribe().isQueryable())
            {
                String typeOfRelation = childRelation.isCascadeDelete() && childRelation.getField().getDescribe().getRelationshipOrder()!=null?'Master-Detail':'Look up';
                List<Map<String, String>> childList = new List<Map<String, String>>();
                String childObjectName = String.valueOf(childRelation.getChildSObject());
                String nameField='';
                
                for(SObjectField field :childRelation.getChildSObject().getDescribe().fields.getMap().values())
                {
                    DescribeFieldResult describe  = field.getDescribe();
                    if(describe.isNameField())
                        nameField = describe.getName();
                }
                
                try
                {
                    SObject[] sobjectRecords = Database.query('select '+nameField+' from ' + childObjectName + ' where ' + childRelation.getField() + ' = :recordId');
                    for (SObject sobj : sobjectRecords) 
                    {
                        Map<String, String> record = new Map<String, String>();
                        System.debug(sobj.get(nameField));
                        record.put('Name', String.valueOf(sobj.get(nameField)));
                        record.put('Id', sobj.Id);
                        childList.add(record);
                    }
                }
                catch(Exception e)
                {
                    System.debug(e);
                }
                if(childList.size()>0) children.put(childRelation.getChildSObject()+','+typeOfRelation+','+nameField, childList);
            }
            
        }
        
        return children;


        
    }

    @AuraEnabled
   public static Map<String, List<Map<String, String>>> getParentRecords(Id recordId)
    {
     	Map<String, List<Map<String, String>>> parents = new Map<String, List<Map<String, String>>>();
        String objectAPIName = recordId.getSObjectType().getDescribe().getName();
        SObjectType objectType = Schema.getGlobalDescribe().get(objectAPIName);
        

        Set<String> parentNames = new Set<String>();

        for(Schema.SobjectField field: objectType.getDescribe().fields.getMap().Values())
        {
            if(field.getDescribe().getType() == Schema.DisplayType.REFERENCE)
            {
                String parentName = String.valueOf(field.getDescribe().getReferenceTo());                                      
                parentNames.add(parentName);
                parentName = parentName.Substring(1, parentName.length()-1); //parent name is returned in the format (name). () are removed.
                	
                String nameField = getNameField(parentName);
                if(nameField==null) continue;
                Integer relationshipOrder = field.getDescribe().getRelationshipOrder();
                
                String relationshipType = relationshipOrder==null?'Lookup':'Master-Detail';                
                
                if(field.getDescribe().isCustom())
                    parentName=parentName.substring(0, parentName.length()-1)+'r'; // For custom objects, while querying parent name must contain __r.
                
                String query = 'select '+parentName+'.id, ' + parentName+'.'+nameField+' , id from '+objectAPIName+' where id='+'\''+recordId+'\'';
				
                List<Map<String, String>> parentRecords = new List<Map<String, String>>();

                try
                {
                    List<SObject> parentRecordsSObjects = Database.query(query);
                    for(SObject parentRecordObject: parentRecordsSObjects)
                    {						
                        parentRecordObject = parentRecordObject.getSObject(parentName);
                        Map<String, String> parentRecord = new Map<String, String>();
                        parentRecord.put('Name', String.valueOf(parentRecordObject.get(nameField)));
                        parentRecord.put('Id' , String.valueOf(parentRecordObject.get('id')));
						parentRecords.add(parentRecord);
                    }
                }
                catch(Exception e)
                {
                    System.debug(e);
                }
                
                if(parentRecords.size()>0) parents.put(parentName+','+relationshipType+','+nameField, parentRecords);
            }
        }
     return parents;

    }


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
}
