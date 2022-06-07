import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import D3 from '@salesforce/resourceUrl/network_d3';

export default class entityGraphicalDisplay extends LightningElement 
{
    @api children;
    @api parents;
    @api entity;

    clicked='none';

    svgHeight = 500;
    svgWidth = 800;

    d3Initialized = false;

    onRelatedEntityClick(d)
    {
        const entityName = d.name.split(' ')[0];
        
        if(entityName!==this.entity)
        {
            const entityClickEvent = new CustomEvent('fetchdetailsforentity', { detail: entityName });
            this.dispatchEvent(entityClickEvent);

        }

    }
    
    renderedCallback() {
        console.log('Rendered callback called');
        if (this.d3Initialized) {
            return;
        }
        this.d3Initialized = true;

        Promise.all([
            loadScript(this, D3 + '/d3.v5.min.js'),
            loadStyle(this, D3 + '/style.css')
        ])
            .then(() => {
                this.initializeD3();
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading D3',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }
    
    initializeD3 = () =>
    {
        var svgHeight = this.svgHeight;
        var svgWidth = this.svgWidth;
        
        let nodes=[];
        let links=[];

        this.parents.forEach((parent)=>{
            nodes.push({"name": getEntityInfoString(parent, 'parent'), "group": 1});
            links.push({"source": this.entity, "target": getEntityInfoString(parent, 'parent')});
        });

        this.children.forEach((child)=>{
            nodes.push({"name": getEntityInfoString(child, 'child'), "group": 1});
            links.push({"source": this.entity, "target": getEntityInfoString(child, 'child') });
        });

        function getEntityInfoString(entityObject, type)
        {
            return `${entityObject.Name} (${entityObject.RelationshipType} ${type.toUpperCase()})`;
        }

        nodes.push({"name": this.entity, "group": 1});

        const graph = {
            "nodes": nodes,
            "links": links
        }
        
       
        var simulation = d3.forceSimulation()
            .force("ct", d3.forceCenter(svgHeight / 2, svgWidth / 4))
            .force("link", d3.forceLink().id(function(d) { return d.name; })
                .distance(180).strength(4))
            .force("charge", d3.forceManyBody().strength(-5000))
              .force("centering", d3.forceCenter(svgWidth/3.5, svgHeight/2))
            .force("x", d3.forceX(svgWidth / 2))
            .force("y", d3.forceY(svgHeight / 2))
            .on("tick", tick);
        
        var svg = d3.select(this.template.querySelector('svg.d3')).append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
        
        svg.append("g").attr("class", "links");
        svg.append("g").attr("class", "nodes");
        
        function start(graph) {
        
            var linkElements = svg.select(".links").selectAll(".link").data(graph.links);
        
            linkElements.enter().append("line").attr("class", "link");
            linkElements.exit().remove();
        
            var nodeElements = svg.select(".nodes").selectAll(".node")
                .data(graph.nodes, function(d) { return d.name })
                .enter().append("g")
                .attr("class", "node");
        
            var circles = nodeElements.append("circle")
                .attr("r", 5);
        
            var labels = nodeElements.append("text")
                .text(function(d) { return d.name; })
                .attr("x", 10)
                .attr("y", 10);
        
            nodeElements.exit().remove();
        
            simulation.nodes(graph.nodes);
            simulation.force("link").links(graph.links);
            simulation.alphaTarget(0.1).restart();
        }
        
        function tick() {
            var nodeElements = svg.select(".nodes").selectAll(".node");
            var linkElements = svg.select(".links").selectAll(".link");
        
            nodeElements.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));
        
            linkElements.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }

        let dragstarted = function(d) {
            this.onRelatedEntityClick(d);

            if (!d3.event.active) simulation.alphaTarget(0.1).restart();
            d.fx = d.x;
            d.fy = d.y;
         }

        dragstarted = dragstarted.bind(this);   
        
        
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        start(graph);
    }
}