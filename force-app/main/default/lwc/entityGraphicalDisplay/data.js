export default {
    nodes: [
        { id: 'Account', group: 1 },
        { id: 'User', group: 1 },
        { id: 'Property__c', group: 1 },
        { id: 'Broker__c', group: 1 },

       
    ],
    links: [
        { source: 'User', target: 'Account', value: 2 },
        { source: 'Property__c', target: 'Account', value: 2 },
        { source: 'Broker__c', target: 'Account', value: 2 },

    ]
};