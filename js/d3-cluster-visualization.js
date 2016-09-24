var graph;
var maxRadius = 50,
    minRadius = 10,
    maxDistance = 50
minDistance = 10;

var zoommingFactor = 0.5,
    radiusFactor = 1,
    distanceFactor = 1;

var numberOfNodes = 0,
    maxFullyConnectedNodes = 25,
    maximumDisplayedNodes = 100,
    maxNearNodes = 10;

function myGraph() {

    // Add and remove elements on the graph object
    this.addNode = function(id) {
        if (!findNode(id)) {
            nodes.push({
                "id": id
            });
            update();
        }
    };

    this.removeNode = function(id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            } else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        update();
    };

    this.removeLink = function(source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        update();
    };

    this.removeAllLinks = function() {
        links.splice(0, links.length);
        update();
    };

    this.removeAllNodes = function() {
        nodes.splice(0, links.length);
        update();
    };

    this.addLink = function(source, target, distance) {
        var sourceNode = findNode(source);
        var targetNode = findNode(target);

        if ((sourceNode && targetNode) || nodes.length < maximumDisplayedNodes) {
            if (!sourceNode) {
                this.addNode(source);
                sourceNode = findNode(source);
            }

            if (!targetNode) {
                this.addNode(target);
                targetNode = findNode(target);
            }

            links.push({
                "source": sourceNode,
                "target": targetNode,
                "distance": distance
            });
            update();
        }
    };

    numberOfNodes = orderedNodeInfo.length;
    var denserNodes = [];

    if (numberOfNodes > maximumDisplayedNodes && maximumDisplayedNodes <= maxFullyConnectedNodes) {
        var denserNodes = new Array(maximumDisplayedNodes);
        for (var i = 0; i < maximumDisplayedNodes; i++) {
            denserNodes[i] = orderedNodeInfo[numberOfNodes - i - 1];
        }
    } else {
        denserNodes.push(orderedNodeInfo[numberOfNodes - 1]);
    }

    var isDenserNode = function(node) {
        var isDenser = false;
        denserNodes.forEach(function(denserNode){
            if(node.id === denserNode.id){
                isDenser = true;
            }
        });
        return isDenser;
    }

    this.isDenserLink = function(link) {
        return isDenserNode(link.source) || isDenserNode(link.target);
    };

    var findNode = function(id) {
        for (var i in nodes) {
            if (nodes[i]["id"] === id) return nodes[i];
        };
    };

    var findNodeIndex = function(id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        };
    };

    var getNodeRadius = function(d) {
        var radius = nodesInfo[d.id].radius * maxRadius;
        radius = radius > minRadius ? radius : minRadius;
        return radius * zoommingFactor * radiusFactor;
    }

    // set up the D3 visualisation in the specified element
    var w = window.innerWidth - 20,
        h = window.innerHeight - 20;

    var densities = [];
    for(var i = 0; i < Math.min(numberOfNodes, maximumDisplayedNodes); i++){
        densities.push(orderedNodeInfo[numberOfNodes-i-1].density);
    }


    // var color = d3.scale.linear().domain([0.1, 0.25, 0.35, 0.6, 0.8, 1]).range(['#ABB2BE', '#99C27C', '#5AB6C1', '#63ADE9', '#C57BDB', '#DE6D77']);
    var color = d3.scale.quantile().domain(densities).range(['#ABB2BE', '#99C27C', '#5AB6C1', '#63ADE9', '#C57BDB', '#DE6D77']);

    var vis = d3.select("body")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", "svg")
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
        links = force.links();

    var update = function() {
        var link = vis.selectAll("line")
            .data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });

        link.enter().append("line")
            .attr("id", function(d) {
                return d.source.id + "-" + d.target.id;
            })
            .attr("class", "link");

        link.append("title")
            .text(function(d) {
                return d.distance;
            });
        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .on("click", click)
            .call(force.drag);

        nodeEnter.append("svg:circle")
            .attr("r", function(d) {
                return getNodeRadius(d)
            })
            .attr("id", function(d) {
                return "Node;" + d.id;
            })
            .attr("class", "nodeStrokeClass")
            .attr("fill", function(d) {
                return color(nodesInfo[d.id].density);
            });

        nodeEnter.append("svg:text")
            .attr("class", "textClass")
            .attr("x", function(d) {
                var x = getNodeRadius(d) - 5;
                return x > 0 ? x : 0;
            })
            .attr("y", ".31em")
            .text(function(d) {
                return nodesInfo[d.id].name || d.id;
            });

        node.exit().remove();

        force.on("tick", function() {

            node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function(d) {
                    return d.source.x;
                })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", function(d) {
                    return d.target.x;
                })
                .attr("y2", function(d) {
                    return d.target.y;
                });
        });

        // Restart the force layout.
        force
            .gravity(.01)
            .charge(-80000)
            .friction(0.05)
            .linkDistance(function(d) {
                var distance = d.distance * maxDistance;
                distance = distance > minDistance ? distance : minDistance;
                return distance * zoommingFactor * distanceFactor;
            })
            .size([w, h])
            .start();
    };

    var click = function(d) {
        if (d3.event.defaultPrevented) return; // ignore drag

        if (d.fixed) {
            if (numberOfNodes <= maxFullyConnectedNodes || maximumDisplayedNodes <= maxFullyConnectedNodes) {
                graph.removeAllLinks

                csvLinks.forEach(function(link) {
                    if (numberOfNodes <= maxFullyConnectedNodes || graph.isDenserLink(link) ) {
                        addLink(link);
                    }
                });
                d.fixed = false;
            } else {

                d.fixed = false;

                graph.removeAllLinks();

                var nodeLinks = [];
                csvLinks.forEach(function(link) {
                    if (link.source.id === d.id || link.target.id === d.id) {
                        nodeLinks.push(link);
                    }
                });

                nodeLinks.sort(function(a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });

                var nearNodesDisplayed = 0;
                nodeLinks.forEach(function(link) {
                    if (maxNearNodes >= nearNodesDisplayed++) {
                        graph.addLink(link.source.id, link.target.id, link.distance);
                    }
                });
            }
        } else {
            graph.removeAllLinks();
            //release nodes
            force.nodes().forEach(function(node) {
                node.fixed = false;
            });

            csvLinks.forEach(function(link) {
                if (link.source.id === d.id
                    || link.target.id === d.id
                    || numberOfNodes <= maxFullyConnectedNodes
                    && graph.isDenserLink(link)){
                    addLink(link);
                }
            });

            //fix clicked node
            d.fixed = true;
        }

        keepNodesOnTop();
        update();
    }

    // Make it all go
    update();
}

function drawGraph() {

    graph = new myGraph("#svgdiv");

    // callback for the changes in the network
    var step = 1;

    function nextval(delay) {
        return delay * step++; // initial time, wait time
    }

    csvLinks.forEach(function(link) {
        if (numberOfNodes <= maxFullyConnectedNodes || graph.isDenserLink(link)) {
            setTimeout(function() {
                addLink(link);
                keepNodesOnTop();
            }, nextval(25));
        }
    });

}

function addLink(link) {
    graph.addLink(link.source.id, link.target.id, link.distance);
}

function addAllLinks() {
    csvLinks.forEach(function(link) {
        addLink(link);
    });
}

// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    $(".nodeStrokeClass").each(function(index) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}

function addNodes() {
    d3.select("svg")
        .remove();
    drawGraph();
}

function parseLink(link) {
    if (link.source) {
        link.source = csvNodes[link.source] ||
            (csvNodes[link.source] = {
                id: link.source
            });
    }

    if (link.target) {
        link.target = csvNodes[link.target] ||
            (csvNodes[link.target] = {
                id: link.target
            });
    }
}

var q = d3.queue();
var csvLinks = [],
    csvNodes = {},
    nodesInfo = {},
    orderedNodeInfo = [];

q.defer(function(callback) {
    //load links
    d3.csv(getLinksFile(), function(error, data) {
        if (error) throw error;

        var i = 0;
        data.forEach(function(d) {
            if (d.source || d.target) {
                csvLinks[i] = {
                    source: d.source,
                    target: d.target,
                    distance: d.distance
                };
                //parse link to node
                parseLink(csvLinks[i]);
                i++;
            }
        });

        callback(null);
    });
});

q.defer(function(callback) {
    //load nodes info
    d3.csv(getNodesFile(), function(error, data) {
        if (error) throw error;

        data.forEach(function(d) {
            nodesInfo[d.node] = {
                radius: d.radius,
                density: d.density,
                name: d.name
            }

            orderedNodeInfo.push({
                id: d.node,
                radius: d.radius,
                density: d.density,
                name: d.name
            });
        });
        callback(null);
    });
});

q.awaitAll(function(error) {
    if (error) throw error;
    drawGraph();
});
