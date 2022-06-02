import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { loadStyle, loadScript } from 'lightning/platformResourceLoader'
import { CurrentPageReference } from 'lightning/navigation'
import { getRecord, getFieldValue } from 'lightning/uiRecordApi'
import dataBridge from './dataBridge.js'
import D3 from '@salesforce/resourceUrl/network_d3'


export default class NetworkVisualizer extends LightningElement {
    @api recordId
    @api title
    @api apiUrl
    @api icon
    @api lookupField
    @api imageName
    @api labelName
    @api showLabels = false

    @track record;

    // svgWidth = 500;
    svgHeight = 350;
    apiResult = undefined;
    masterNode = undefined;
    nodeLinks = undefined;
    tabTitles = undefined;
    tabData = undefined;


    @wire(getRecord, { recordId: '$recordId', fields: '$lookupField' })
    wiredRecord({ data, error }) {
        console.log('showlabels = ' + this.showLabels);

        this.masterNode = [
            { 'id': 'Me', 'group': 1, 'weight': 30, 'type': 'Me', 'image': this.imageName, 'label': this.labelName }
        ];

        if (data) {
            this.record = [...Object.keys(data.fields).map(key => {
                return data.fields[key].value;
            })];

            this.error = undefined;

            if (this.record == null || this.record == '') {
                console.log('**** No external lookup field found ***** ');
            }
            else {
                this.executeCallout(this.record);
            }
        }

        else {
            console.log('Trouble getting data -- Error:' + error);
        }
    } // end wiredRecord

    async executeCallout(lookupField) {
        if (lookupField == null || lookupField == '') {
            console.log('**** No external lookup field found ***** ');
            return;
        }

        if (this.apiUrl == null || this.apiUrl == '') {
            console.log('**** Componenet Not Configured ***** ');
            return;
        }

        let result = await dataBridge(this.apiUrl, lookupField);
        this.apiResult = result;

        let newMasters = this.masterNode;

        let newLinks = [];
        let tabs = [];
        let tabsData = [];

        result.sort((a, b) => parseInt(a.SortOrder) - parseInt(b.SortOrder));

        result.forEach(function (entry) {
            let newLink = { 'source': entry['Type'], 'target': 'Me' };
            let newMaster = { 'id': entry['Type'], 'type': entry['Type'] };
            let aTab = { 'title': entry['Name'], 'extId': entry['Id'] };

            newMasters.push(newMaster);
            newLinks.push(newLink);
            tabs.push(entry['Type']);
            tabsData.push(aTab);
        })

        this.nodeLinks = newLinks;
        this.masterNode = newMasters;
        this.tabTitles = tabs;
        this.tabData = tabsData;

        Promise.all([
            loadScript(this, D3 + '/d3.min.js'),
            loadStyle(this, D3 + '/style.css')
        ])
            .then(() => {
                this.drawVis();
            })
            .catch((error) => {
                console.log('*** Error loading D3 ****' + error.message)
            });

    }

    drawVis() {
        const svg = d3.select(this.template.querySelector('svg.d3'));
        const width = svg.node().getBoundingClientRect().width;
        const height = this.svgHeight;
        const color = d3.scaleOrdinal(d3.schemeDark2);
        const iconRatio = Math.round(width * 0.14);
        const lineRatio = Math.round(width * 0.21);
        const iconSize = iconRatio > 60 ? 60 : iconRatio;
        const lineLength = lineRatio > 90 ? 90 : lineRatio;

        const simulation = d3
            .forceSimulation()
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('charge', d3.forceManyBody().strength(-1000))
            .force(
                'link',
                d3.forceLink().id((d) => {
                    return d.id;
                }).distance(lineLength)
            )

        const link = svg
            .append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.nodeLinks)
            .enter()
            .append('line')
            .attr('stroke-width', (d) => {
                if (d.value)
                    return Math.sqrt(d.value);
                else
                    return Math.sqrt(1);
            });

        const node = svg
            .append('g')
            .attr('class', 'nodes');

        const cirNode = node.selectAll('circle')
            .data(this.masterNode)
            .enter()
            .append('image')
            .attr('href', (d) => {
                if (d.type == 'MDM')
                    return D3 + '/mdm.png';
                else if (d.type == 'SALESFORCE_B2C')
                    return D3 + '/commerce.png';
                else if (d.type == 'SALESFORCE_MARKETING')
                    return D3 + '/marketing.png';
                else if (d.type == 'SALESFORCE_CORE')
                    return D3 + '/sales.png';
                else if (d.type == 'SALESFORCE_MFG')
                    return D3 + '/mfg.png';
                else if (d.type == 'SAP_ECC')
                    return D3 + '/sap.png';
                else if (d.type == 'SAP_4HANA')
                    return D3 + '/s4hana.png';
                else if (d.type == 'OFBIZ')
                    return D3 + '/ofbiz.png';
                else if (d.type == 'LOS')
                    return D3 + '/db.png';
                else if (d.type == 'SALESFORCE_FSC_BANKING' || d.type == 'SALESFORCE_FSC_INSURANCE' || d.type == 'SALESFORCE_FSC_WEALTH')
                    return D3 + '/fsc.png';
                else if (d.type == 'HOGAN')
                    return D3 + '/hogan.png';
                else if (d.type == 'FIS')
                    return D3 + '/fis.png';
                else if (d.type == 'DOCUSIGN')
                    return D3 + '/docusign.png';
                else if (d.type == 'PIM')
                    return D3 + '/db.png';
                else if (d.type == 'CREDIT_CARD')
                    return D3 + '/db.png';
                else if (d.type == 'CORE_BANKING')
                    return D3 + '/db.png';
                else if (d.type == 'Me')
                    return D3 + '/' + d.image + '.png';
                else
                    return D3 + '/oscar.png';
            })
            .attr('width', iconSize)
            .attr('height', iconSize);


            const txt = node.selectAll(null)
            .data(this.masterNode)
            .enter()
            .append('text')
            .text((d) => {
                if (d.type == 'MDM')
                    return 'MDM';
                else if (d.type == 'SALESFORCE_B2C')
                    return 'Commerce';
                else if (d.type == 'SALESFORCE_MARKETING')
                    return 'Marketing';
                else if (d.type == 'SALESFORCE_CORE')
                    return 'Sales';
                else if (d.type == 'SALESFORCE_MFG')
                    return 'Manufacturing Cloud';    
                else if (d.type == 'SAP_ECC')
                    return 'SAP ECC';
                else if (d.type == 'SAP_4HANA')
                    return 'SAP S/4HANA';
                else if (d.type == 'OFBIZ')
                    return 'OMS';
                else if (d.type == 'LOS')
                    return 'LOS';
                else if (d.type == 'FIS')
                    return 'FIS';
                else if (d.type == 'DOCUSIGN')
                    return 'DOCUSIGN';
                else if (d.type == 'HOGAN')
                    return 'HOGAN';
                else if (d.type == 'SALESFORCE_FSC_BANKING')
                    return 'FSC Banking';                 
                else if (d.type == 'SALESFORCE_FSC_INSURANCE')
                    return 'FSC Insurance';                 
                else if (d.type == 'SALESFORCE_FSC_WEALTH')
                    return 'FSC Wealth';                 
                else if (d.type == 'PIM')
                    return 'PIM';
                else if (d.type == 'CREDIT_CARD')
                    return 'Credit Card';
                else if (d.type == 'CORE_BANKING')
                    return 'Core Banking';
                else if (d.type == 'Me')
                    return d.label;
                else
                    return null;
            })
            .style("text-anchor", "middle")
            .style("fill", "#555")
            .style("font-family", "Sans-serif")
            .style("font-size", (iconSize/5));


        simulation.nodes(this.masterNode)
        simulation.force('link').links(this.nodeLinks);

        if (this.showLabels == true)
            simulation.on('tick', ticked);
        else
            simulation.on('tick', tickedNoText);

        function ticked() {

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            cirNode.attr("x", d => d.x - (iconSize/2))
                .attr("y", d => d.y - (iconSize/2));

            txt.attr("x", d => d.x)
            .attr("y", d => d.y + (iconSize/1.9));
        }

        function tickedNoText() {

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            cirNode.attr("x", d => d.x - (iconSize/2))
                .attr("y", d => d.y - (iconSize/2));
            
            txt.attr("opacity", 0); 
        }

    }
}






