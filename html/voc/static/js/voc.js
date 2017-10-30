var vocab=$("#vocab").html();
var json=JSON.parse(vocab);

var uiLanguage="en";
var uiText=[];
uiText["Exact match:"] = "Exact match:";
uiText["Close match:"] = "Close match:";
uiText["Broad match:"] = "Broad match:";
uiText["Related match:"] = "Related match:";
uiText["Subclass of:"] = "Subclass of:";
uiText["Subproperty of:"] = "Subproperty of:";
uiText["Related (within the context of):"] = "Related (within the context of):";
uiText["See also:"] = "See also:";
uiText["Properties of"] = "Properties of";
uiText["A subclass of"] = "A subclass of";
uiText["Has subclasses"] = "Has subclasses";


var objectProperties={};
var datatypeProperties={};
var graph=json["@graph"];

var nodeTypes=getNodeTypes();


function doSearch() {
  var searchTerm=$('#searchTerm').val();
  searchTerm=searchTerm.replace(/[ ]+$/,"");
  searchTerm=searchTerm.replace(/^[ ]+/,"");

  var searchTermLC=searchTerm.toLowerCase();
  var classes={};
  var properties={};
  var typecodes={};
  var typecodeinstances={};
  var foundClass=false;
  var foundProperty=false;
  var foundTypecode=false;
  var foundTypecodeinstance=false;
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    var label=value["rdfs:label"];
    var comment=value["rdfs:comment"] || [];
    var prefLabel=value["skos:prefLabel"] || [];
    var labelvalue=selectLanguage(label,uiLanguage);
    var commentvalue=selectLanguage(comment,uiLanguage);
    var haystack=(labelvalue+"\t"+commentvalue+"\t"+prefLabel+"\t"+id).toLowerCase();
    if (haystack.indexOf(searchTermLC) > -1) {
      var detType=determineType(id);
      switch(detType) {
        case "Class":
          classes[id]=value;
          foundClass=true;
          break;
        case "property":
          properties[id]=value;
          foundProperty=true;
          break;
        case "TypeCode":
          typecodes[id]=value;
          foundTypecode=true;
          break;
        case "typeCodeInstance":
          typecodeinstances[id]=value;
          foundTypecodeinstance=true;
          break;
        }
    }

  });

  if (foundClass) {
  var tableContents=tabulateClasses(classes);
  $("#classResultsDetails").html(tableContents);
  $("#classResults").show();
  } else {
  $("#classResults").hide();
  }

  if (foundProperty) {
  var tableContents=tabulateProperties(properties,true,true);
  $("#propertyResultsDetails").html(tableContents);
  $("#propertyResults").show();
  } else {
  $("#propertyResults").hide();
  }

  if (foundTypecode) {
  var tableContents=tabulateTypeCodes(typecodes);
  $("#typecodeResultsDetails").html(tableContents);
  $("#typecodeResults").show();
  } else {
  $("#typecodeResults").hide();
  }

  if (foundTypecodeinstance) {
  var tableContents=tabulateInstances(typecodeinstances);
  $("#typecodeinstanceResultsDetails").html(tableContents);
  $("#typecodeinstanceResults").show();
  } else {
  $("#typecodeinstanceResults").hide();
  }

  if (foundClass || foundProperty || foundTypecode || foundTypecodeinstance ) {
  $(".searchresults").show();
  }


  }

  $("#classResults").hide();
  $("#propertyResults").hide();
  $("#typecodeResults").hide();
  $("#typecodeinstanceResults").hide();

  $('#doSearch').attr('type','button');


  var searchTermBox = document.getElementById("searchTerm");


  searchTermBox.addEventListener("keydown", function(event) {
    if (event.keyCode == 13) { event.preventDefault(); }
  });

  searchTermBox.addEventListener("keyup", function(event) {
      if (($("#searchTerm").val().length > 2)) {
          doSearch();
          return false;
      }
  });

  searchTermBox.addEventListener("change", function(event) {
      if (($("#searchTerm").val().length > 2)) {
          doSearch();
          return false;
      }
  });




  $('#doSearch').click( function() {
  doSearch();
  });

function getAllClasses() {
  var classes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    if ((type.indexOf("owl:Class") > -1) && (id.substring(0,2) !== "_:")) {
      classes[id]=value;
    }
  });
  return classes;
}



function getAllProperties() {
  var properties={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] || [];
    if (type.indexOf("rdf:Property") > -1) {
      properties[value["@id"]]=value;
    }
  });
  return properties;
}

function getAllTypeCodes() {
  var typecodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["rdfs:subClassOf"] || [];
    if ((type !== null) && (type["@id"]=="gdx:TypeCode")) {
      typecodes[value["@id"]]=value;
    }
  });
  return typecodes;
}

function getLinkedIDarray(obj,filter) {
  var r=[];
  if ((obj !== undefined) && (obj !== null)) {
    if (obj["@id"] !== undefined) {
      if (obj["@id"].indexOf(filter) > -1) {
        r.push(prepareLink(obj["@id"]));
      }
    } else {
      $.each(obj, function( index, value ) {
        if (value["@id"].indexOf(filter) > -1) {
          r.push(prepareLink(value["@id"]));
        }
      });
    }
  }
  return r;
}



function getSubClasses(val) {
  // get class nodes that are subclasses of specified class
  return getNodes(val,"rdfs:subClassOf");
}

function getProperties(val) {
  // get property nodes that have specified class as their domain
  return getNodes(val,"rdfs:domain");

}

function getProperties2(term) {
  var props={};
  $.each(getAllProperties(), function( index, value ) {
    var d = value["rdfs:domain"];
    var fdl = getFlatDomainList(d);
    if (fdl.indexOf('"'+term+'"') > -1) {
      props[index]=value;
    }
  });
  return props;
}



function getPropertiesOfType(val) {
  // get property nodes that have specified class as their domain
  return getNodes(val,"rdfs:range");
}

function getOfType(val) {
  // get property nodes of specified type
  return getNodes2(val,"@type");
}

function getNodeTypes() {
  var nodetypes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var type=value["@type"] ;
    var parent=value["rdfs:subClassOf"] || [];
    var parentName=parent["@id"] ;
    var ubertype = type || parentName;
    nodetypes[id]=ubertype;
  });
  return nodetypes;
}



function getNode(val) {
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      nodes[value["@id"]]=value;
    }
  });
  return nodes;
}

function getSuperClasses(val) {
  var superclasses=[];
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      var parent=value["rdfs:subClassOf"] || [];
      var parentName=parent["@id"] || "";
      superclasses.push(parentName);
    }
  });

  return superclasses;
}


function getNodes(val,predicate) {
  // builds an object (associative array) {@nodeid: node} for all matching nodes where nodeid predicate val
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var node=value[predicate] || [];
    if (Array.isArray(node)) {
      $.each(node, function( index, nodeEl ) {
        var nodeName = nodeEl["@id"] || "";
        if (nodeName == val) {
          nodes[value["@id"]]=value;
        }
      });
    } else {
      var nodeName = node["@id"] || "";
      if (nodeName == val) {
        nodes[value["@id"]]=value;
      }
    }
  });
  return nodes;
}


function getNodes2(val,predicate) {
  // builds an object (associative array) {@nodeid: node} for all matching nodes where nodeid predicate val
  var nodes={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var node=value[predicate] || [];
    if (Array.isArray(node)) {
      $.each(node, function( index, nodeEl ) {
        var nodeName = nodeEl["@id"] || "";
        if (nodeName == val) {
          nodes[value["@id"]]=value;
        }
      });
    } else {
      if (node == val) {
        nodes[value["@id"]]=value;
      }
    }
  });
  return nodes;
}


function listValues(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
  });
}

function listObject(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
  });
}

function listArray(obj) {
  $.each(obj, function(index,value) {

  });
}

function listProperties(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
    var range=value["rdfs:range"] || [];
  });
}

function listClasses(obj) {
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var value=obj[keyname];
    var parent=value["rdfs:subClassOf"] || [];
    var parentClassName = parent["@id"] || "";
    if (parentClassName !== "") {
      var scNote=uiText["A subclass of"]+" "+prepareLink(parentClassName);
      $("#subclassNote").html(scNote);
      $("#subclassNote").show();
    } else {
      $("#subclassNote").hide();
    }
  });
}

function getSingleNode(val) {
  var rtnval=null;
  var found=false;
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    if (id == val) {
      found=true;
      rtnvalue=value;
    }
  });
  if (!found) {
    rtnvalue=null;
  }
  return rtnvalue;
}

function prepareLink(val) {
  var url;
  var target;
  var link=val;
  if ((val !== undefined) && (val !== null)) {
    if (val.indexOf("http://geodex.org/voc/") == 0) {
      url=val.replace(/^http:\/\/geodex\.org\/voc\//g , "");
      link='<a href="'+url+'" class="link">gdx:'+url+'</a>';
    }
    if (val.indexOf("gdx:") == 0) {
      url=val.replace(/^gdx:/g , "");
      link='<a href="'+url+'" class="link">'+val+'</a>';
    }
    if (val.indexOf("rdf:") == 0) {
      url=val.replace(/^rdf:/g , "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("xsd:") == 0) {
      url=val.replace(/^xsd:/g , "http://www.w3.org/2001/XMLSchema#");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("dc:") == 0) {
      url=val.replace(/^foaf:/g , "http://purl.org/dc/elements/1.1/");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("dcterms:") == 0) {
      url=val.replace(/^vcard:/g , "http://purl.org/dc/terms/");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("skos:") == 0) {
      url=val.replace(/^vcard:/g , "http://www.w3.org/2004/02/skos/core#");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("schema:") == 0) {
      url=val.replace(/^schema:/g , "http://schema.org/");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
  }
  return link;
}

function prepareLink2(val,label) {
  var url;
  var target;
  var link=val;
  if ((val !== undefined) && (val !== null)) {
    if (val.indexOf("http://geodex.org/voc/") == 0) {
      url=val.replace(/^http:\/\/geodex\.org\/voc\//g , "");
      link='<a href="'+url+'" class="link">'+label+'</a>';
    }
    if (val.indexOf("gdx:") == 0) {
      url=val.replace(/^gdx:/g , "");
      link='<a href="'+url+'" class="link">'+label+'</a>';
    }
    if (val.indexOf("rdf:") == 0) {
      url=val.replace(/^rdf:/g , "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
      link='<a href="'+url+'"  class="link" target="_blank">'+label+'</a>';
    }
    if (val.indexOf("xsd:") == 0) {
      url=val.replace(/^xsd:/g , "http://www.w3.org/2001/XMLSchema#");
      link='<a href="'+url+'"  class="link" target="_blank">'+label+'</a>';
    }
    if (val.indexOf("dc:") == 0) {
      url=val.replace(/^foaf:/g , "http://purl.org/dc/elements/1.1/");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("dcterms:") == 0) {
      url=val.replace(/^vcard:/g , "http://purl.org/dc/terms/");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("skos:") == 0) {
      url=val.replace(/^vcard:/g , "http://www.w3.org/2004/02/skos/core#");
      link='<a href="'+url+'"  class="link" target="_blank">'+val+'</a>';
    }
    if (val.indexOf("schema:") == 0) {
      url=val.replace(/^schema:/g , "http://schema.org/");
      link='<a href="'+url+'"  class="link" target="_blank">'+label+'</a>';
    }
  }
  return link;
}


function determineType(val) {
  var type=null;
  var first=nodeTypes[val] || "";
  var second=nodeTypes[first] || "";
  if ( (first.indexOf('owl:Class') > -1) || (first.indexOf('rdfs:Class') > -1 ) ) {
    type="Class";
  }
  if ( (first.indexOf('rdf:Property') > -1) || (first.indexOf('owl:ObjectProperty') > -1) || (first.indexOf('owl:DatatypeProperty') > -1) ) {
    type="property";
  }
  if ( first.indexOf('gdx:TypeCode') > -1  ) {
    type="TypeCode";
  }

  if ( second.indexOf('gdx:TypeCode') > -1  ) {
    type="typeCodeInstance";
  }
  return type;
}

function tabulateRange(obj) {
  var tableContents="";
  var tableRow="";
  var range = obj["rdfs:range"];
  if ( range instanceof Array) {
    $.each(range, function( index, value ) {
    var rangeid=value["@id"] || [];
    tableRow+="<tr><td>"+prepareLink(rangeid)+"</td></tr>";
    tableContents+=tableRow;
    });
  } else {
    var rangeid=range["@id"] || [];
    tableRow="<tr><td>"+prepareLink(rangeid)+"</td></tr>";
    tableContents=tableRow;
  }
  return tableContents;
}

function getFlatDomainList(domain) {
  var rv=[];
  if (domain["@id"] !== undefined) {
    if  (domain["@id"].substring(0,2) == "_:" ) {
      var blanknode = domain["@id"];
      var struc = getNode(blanknode)[blanknode]["owl:unionOf"]["@list"];
      $.each(struc, function( index, value ) {
      rv.push(value["@id"]);
      });
    } else {
      rv.push(domain["@id"]);
    }
  }

  if (domain["owl:unionOf"] !== undefined) {
    $.each(domain["owl:unionOf"]["@list"], function( index, value ) {
      rv.push(value["@id"]);
    });
  }

  return JSON.stringify(rv.sort());
}

function tabulateDomain(obj) {
  var tableContents=[];
  var tableRow="";
  var domain = obj["rdfs:domain"];

  if (domain["@id"] !== undefined) {
    if  (domain["@id"].substring(0,2) == "_:" ) {
      var blanknode = domain["@id"];
      var struc = getNode(blanknode)[blanknode]["owl:unionOf"]["@list"];
      $.each(struc, function( index, value ) {
        tableRow="<tr><td>"+prepareLink(value["@id"])+"</td></tr>";
        tableContents.push(tableRow);
      });
    } else {
      tableRow="<tr><td>"+prepareLink(domain["@id"])+"</td></tr>";
      tableContents.push(tableRow);
    }
  }

  if (domain["owl:unionOf"] !== undefined) {
    $.each(domain["owl:unionOf"]["@list"], function( index, value ) {
      tableRow="<tr><td>"+prepareLink(value["@id"])+"</td></tr>";
      tableContents.push(tableRow);
    });
  }

  return tableContents.join("<br>");
}

function tabulateSiblings(obj) {
  var tableContents="";
  var selfid=obj["@id"];
  var domain = obj["rdfs:domain"]["@id"];
  var fdl1 = getFlatDomainList(obj["rdfs:domain"]);
  var range = obj["rdfs:range"]["@id"];
  var sibling={};
  $.each(graph, function( index, value ) {
    var id=value["@id"];
    var r=value["rdfs:range"] || [];
    var d=value["rdfs:domain"] || [];
    var fdl2=getFlatDomainList(d);

    if ((range == r["@id"]) && ( (fdl1 == fdl2) ) && (id !== selfid)) {
      sibling[id]=value;
    }
  });

  var sortedKeys=Object.keys(sibling).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=sibling[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];
    var range=value["rdfs:range"]["@id"] || "";

    tableRow+='<tr>';
    tableRow+='<td class="firstCol3">'+selectLanguage(label,uiLanguage)+'<div class="code-value-uri">'+prepareLink(url)+'</div></td>';
    tableRow+='<td class="secondCol3">'+prepareLink(range)+'</td>';
    tableRow+='<td property="rdfs:comment" class="thirdCol3">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });

  return tableContents;
}

function prepareSubclassList(obj) {
  var list=[];
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var url=keyname;
    if (url !== null) {
      list.push(prepareLink(url));
    }
  });
  return list.join(", ");
}




function tabulateSubclasses(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var label=value["rdfs:label"];
    var url=value["@id"];
    var comment=value["rdfs:comment"] || [];
    tableRow+='<tr about="'+url+'" rev="rdfs:subClassOf">';
    tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
    tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
    tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateSuperclasses(obj) {
  var tableContents="";
  if (obj instanceof Array) {
    $.each(obj, function(index,value) {
      var tableRow="";
      var node=getSingleNode(value);
      if (node !== null) {
        var label=node["rdfs:label"];
        var url=node["@id"];
        var comment=node["rdfs:comment"] || [];
        tableRow+='<tr about="'+url+'" property="rdfs:subClassOf">';
        tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
        tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
        tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
        tableRow+='</tr>';
        tableContents+=tableRow;
      }
    });
  } else {
    var node=getSingleNode(obj);
    if (node !== null) {
      var label=node["rdfs:label"];
      var url=node["@id"];
      var comment=node["rdfs:comment"] || [];
      var tableRow="";
      tableRow+='<tr about="'+url+'" property="rdfs:subClassOf">';
      tableRow+='<td property="rdfs:label" class="firstCol3">'+selectLanguage(label,uiLanguage)+'</td>';
      tableRow+='<td class="secondCol3">'+prepareLink(url)+'</td>';
      tableRow+='<td property="rdfs:label" class="thirdCol3">'+selectLanguage(comment,uiLanguage)+'</td>';
      tableRow+='</tr>';
      tableContents+=tableRow;
    }
  }
  return tableContents;
}

function tabulateClasses(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr>';
    tableRow+='<td class="firstCol2">'+prepareLink(url)+'</td>';
    tableRow+='<td property="rdfs:comment" class="secondCol2">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateTypeCodes(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr>';
    tableRow+='<td class="firstCol2">'+prepareLink(url)+'</td>';
    tableRow+='<td class="secondCol2">'+selectLanguage(label,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function populateBreadcrumbTrail(val,type,node,label) {
  var html="";
  switch (type) {
    case "Class" :
      html+='<li><a href="./" class="link">Geodex Web Vocabulary</a></li>';
      html+='<li><a href="./?show=classes" class="link">All Classes</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "property" :
      html+='<li><a href="./" class="link">Geodex Web Vocabulary</a></li>';
      html+='<li><a href="./?show=properties" class="link">All Properties</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
      break;
    case "TypeCode" :
      html+='<li><a href="./" class="link">Geodex Web Vocabulary</a></li>';
      html+='<li><a href="./?show=typecodes" class="link">All Type Codes</a></li>';
      html+='<li id="currentClass">'+label+'</li>';
  }
  $("#breadcrumbTrail").html(html);
}

function tabulateProperties(obj,linkMiddle,includeMiddle) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  if (includeMiddle) {
    numcols=3;
    finalcolumn="thirdCol3";
  } else {
    numcols=2;
    finalcolumn="secondCol2";
  }

  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var range= [];
    if (value["rdfs:range"] == undefined) {
      console.log(value);
    }
    var range=value["rdfs:range"]["@id"] || [];
    var comment=value["rdfs:comment"] || [];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];

    tableRow+='<tr typeof="rdfs:Property" resource="'+url+'">';
    tableRow+='<td property="rdfs:label" class="firstCol'+numcols+'">'+selectLanguage(label,uiLanguage)+'<div class="code-value-uri">'+prepareLink(url)+'</div>'+'</td>';
    if (includeMiddle) {
      tableRow+='<td property="schema:rangeIncludes" class="secondCol'+numcols+'">';
      if (linkMiddle) {
        tableRow+=prepareLink(range);
      } else {
        tableRow+=range;
      }
      tableRow+='</td>';
    }
    tableRow+='<td property="rdfs:comment" class="'+finalcolumn+'">'+selectLanguage(comment,uiLanguage);
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function tabulateInstances(obj) {
  var tableContents="";
  var sortedKeys=Object.keys(obj).sort();
  $.each(sortedKeys, function(index,keyname) {
    var tableRow="";
    var value=obj[keyname];
    var url=value["@id"] || "";
    var label=value["rdfs:label"];
    var comment=value["rdfs:comment"];
    var skosPrefLabel=value["skos:prefLabel"];
    var commentText=selectLanguage(comment,uiLanguage);
    if (commentText !== "") {
      commentText+="<br>";
    }
    tableRow+='<tr>';
    tableRow+='<td class="firstCol3">'+skosPrefLabel+'</td>';
    tableRow+='<td class="secondCol3">'+selectLanguage(label,uiLanguage)+'</td>';
    tableRow+='<td class="thirdCol3">'+commentText+'<div class="code-value-uri">'+prepareLink(url)+'</div>';
    tableRow+='</td>';
    tableRow+='</tr>';
    tableContents+=tableRow;
  });
  return tableContents;
}

function expandGeodexPrefix(val) {
  return val.replace(/^gdx:/g, "http://geodex.org/voc/");
}

function selectLanguage(obj,langTag) {
  var r="";
  if ((obj !== undefined) && (obj !== null)) {
    if (obj instanceof Array) {
      $.each(obj, function( index, value ) {
        if (value["@language"]==langTag) {
          r = value["@value"];
        }
      });
    } else {
      if (obj["@language"] == langTag) {
        r = obj["@value"];
      }
    }
  }
  return r;
}

function updatestate2(val) {
  val = val.replace(/^\.\//g,"");
  if (val == "") {
    $(document).prop('title', 'Geodex web vocabulary');
    $("#termName").html("Geodex Web Vocabulary");
    $('#breadcrumbTrail').html('<li id="currentClass">Geodex Web Vocabulary</li>');
    $('#breadcrumbTrail').show();
    $('#intro').show();
    $('#termComment').html('');
    $('#termComment').hide();
    $('#termURL').html('http://geodex.org/voc/');
    $('#allClasses').hide();
    $('#allProperties').hide();
    $('#allTypecodes').hide();
    $('#propertiesOfClass').hide();
    $('#propertiesOfParentClass').hide();
    $('#propertiesOfGrandparentClass').hide();
    $('#definedTypecodeinstances').hide();
    $('#subclasses').hide();
    $('#superclasses').hide();
    $('#havingrangeinfo').hide();
    $('#siblinginfo').hide();
    $('#rangeinfo').hide();
    $('#domaininfo').hide();
    $('#triple').hide();
    $("#superclassNote").hide();
    $("#subclassNote").hide();
    $(".termschema").hide();
  } else {
    $(document).prop('title', 'gdx:'+val);
    $('#intro').hide();
    $('#termComment').show();
    $('#breadcrumbTrail').show();
    $("#termName").html(val);
    var term="gdx:"+val;
    var node=getSingleNode(term);
    var type=determineType(term);
    if (node !== null) {
      var termURL=expandGeodexPrefix(node["@id"]);
      $("#termURL").html(termURL);
      var termComment = node["rdfs:comment"];
      var termLabel = node["rdfs:label"];
      var label = selectLanguage(termLabel,uiLanguage)
      $("#termName").html(label);
      populateBreadcrumbTrail(val,type,node,label);
    } else {
      switch(val) {
        case "?show=classes":
          $('#triple').hide();
          $('#termComment').hide();
          $('#termURL').html('http://geodex.org/voc/');
          $('#allClasses').show();
          $('#allProperties').hide();
          $('#allTypecodes').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedTypecodeinstances').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $("#termName").html("All Classes");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">Geodex Web Vocabulary</a></li><li id="currentClass">All Classes</a></li>');
          var classes=getAllClasses();
          var tableContents=tabulateClasses(classes);
          $("#termMemberDetails1").html(tableContents);
          break;

        case "?show=properties":
          $('#triple').hide();
          $('#termComment').hide();
          $('#termURL').html('http://geodex.org/voc/');
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#allClasses').hide();
          $('#allProperties').show();
          $('#allTypecodes').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedTypecodeinstances').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $("#termName").html("All Properties");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">Geodex Web Vocabulary</a></li><li id="currentClass">All Properties</a></li>');
          var properties=getAllProperties();
          var tableContents=tabulateProperties(properties,true,false);
          $("#termMemberDetails2").html(tableContents);
          break;

        case "?show=typecodes":
          $('#triple').hide();
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allTypecodes').show();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedTypecodeinstances').hide();
          $('.searchresults').hide();
          $(".termschema").hide();
          $('#termComment').hide();
          $('#subclassNote').hide();
          $('#superclassNote').hide();
          $('#termURL').html('http://geodex.org/voc/');
          $("#termName").html("All Type Codes");
          $('#breadcrumbTrail').html('<li><a href="./" class="link">Geodex Web Vocabulary</a></li><li id="currentClass">All Type Codes</a></li>');
          var typecodes=getAllTypeCodes();
          var tableContents=tabulateTypeCodes(typecodes);
          $("#termMemberDetails3").html(tableContents);
          break;

        default:
          $('#triple').hide();
          $("#termName").html("Not found! ["+val+"]");
          $('#allClasses').hide();
          $('#allProperties').hide();
          $('#allTypecodes').hide();
          $('#propertiesOfClass').hide();
          $('#propertiesOfParentClass').hide();
          $('#propertiesOfGrandparentClass').hide();
          $('#definedTypecodeinstances').hide();
          break;
      }

      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#siblinginfo').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
    }

    if (type == "Class") {
      var properties=getProperties2(term);
      var tableContents=tabulateProperties(properties,true,true);
      $("#termMemberDetails4").html(tableContents);
      $("#membertableHeader4").html(uiText["Properties of"]+' '+term);

      $("#termComment").html(selectLanguage(termComment,uiLanguage));
      $('#triple').hide();

      var skosExactMatch=getLinkedIDarray(node["skos:exactMatch"],"schema:");
      var skosCloseMatch=getLinkedIDarray(node["skos:closeMatch"],"schema:");
      var skosBroadMatch=getLinkedIDarray(node["skos:broadMatch"],"schema:");
      var skosRelatedMatch=getLinkedIDarray(node["skos:relatedMatch"],"schema:");
      var skosRelated=getLinkedIDarray(node["skos:related"],"schema:");
      var subClassOf=getLinkedIDarray(node["rdfs:subClassOf"],"schema:");
      var seeAlso=getLinkedIDarray(node["rdfs:seeAlso"],"schema:");

      var schemaEquivalent="";

      if (skosExactMatch.length > 0) {
        schemaEquivalent+=uiText["Exact match:"]+" "+skosExactMatch.join(", ")+"<br>";
      }

      if (skosCloseMatch.length > 0) {
        schemaEquivalent+=uiText["Close match:"]+" "+skosCloseMatch.join(", ")+"<br>";
      }

      if (skosBroadMatch.length > 0) {
        schemaEquivalent+=uiText["Broad match:"]+" "+skosBroadMatch.join(", ")+"<br>";
      }

      if (skosRelatedMatch.length > 0) {
        schemaEquivalent+=uiText["Related match:"]+" "+skosRelatedMatch.join(", ")+"<br>";
      }

      if (subClassOf.length > 0) {
        schemaEquivalent+=uiText["Subclass of:"]+" "+subClassOf.join(", ")+"<br>";
      }

      if (skosRelated.length > 0) {
        schemaEquivalent+=uiText["Related (within the context of):"]+" "+skosRelated.join(", ")+"<br>";
      }

      if (seeAlso.length > 0) {
        schemaEquivalent+=uiText["See also:"]+" "+seeAlso.join(", ")+"<br>";
      }

      $("#schemaEquivalent").html(schemaEquivalent);
      if (schemaEquivalent.indexOf('schema:') > -1) {
        $(".termschema").show();
      } else {
        $(".termschema").hide();
      }

      $("#allClasses").hide();
      $("#allProperties").hide();
      $("#allTypecodes").hide();
      $("#propertiesOfClass").show();
      $("#propertiesOfParentClass").hide();
      $("#propertiesOfGrandparentClass").hide();
      $("#definedTypecodeinstances").hide();

      var subClasses=getSubClasses(term);
      if (Object.keys(subClasses).length > 0) {
        var subclassContents = tabulateSubclasses(subClasses);
        var subclassList = prepareSubclassList(subClasses);
        $("#subclassDetails").html(subclassContents);
        $("#subclassNote").html("&#x21E9; "+uiText["Has subclasses"]+": "+subclassList);
        $("#subclassNote").show();
        $('#subclasses').show();
      } else {
        $("#subclassNote").hide();
        $('#subclasses').hide();
      }

      var superClasses=getSuperClasses(term);
      if ((superClasses.length > 0) && (superClasses[0] !== "")) {
        parentName=superClasses[0];
        if (parentName !== "") {
          var scNote='&#x21E7; '+uiText["A subclass of"]+' '+prepareLink(parentName);
          if (parentName.indexOf("gdx:") > -1) {
            $('#propertiesOfParentClass').show();
          }
          $("#superclassNote").html(scNote);
          $("#superclassNote").show();
        } else {
          $("#superclassNote").hide();
        }
      }

      var parentClass="";
      if ((Object.keys(superClasses).length > 0) && (superClasses[0] !== "") && (superClasses[0] !== "owl:Thing")) {
        parentClass=superClasses[0];
        $("#membertableHeader4a").html(uiText["Properties of"]+' '+parentClass);

        var parentProperties=getProperties2(parentClass);
        var tableContents=tabulateProperties(parentProperties,true,true);
        $("#termMemberDetails4a").html(tableContents);
        $("#propertiesOfParentClass").show();

        var grandparentClasses=getSuperClasses(parentClass);
        var grandparentClass="";
        if ((Object.keys(grandparentClasses).length > 0) && (grandparentClasses[0] !== "") && (grandparentClasses[0] !== "owl:Thing")) {
          grandparentClass=grandparentClasses[0];
          $("#membertableHeader4b").html(uiText["Properties of"]+' '+grandparentClass);

          var grandparentProperties=getProperties2(grandparentClass);
          var tableContents=tabulateProperties(grandparentProperties,true,true);
          $("#termMemberDetails4b").html(tableContents);
          $("#propertiesOfGrandparentClass").show();
        }

        var superclassContents = tabulateSuperclasses(superClasses);
        $("#superclassDetails").html('<span rel="rdfs:subClassOf">'+superclassContents+'</span>');
        $('#superclasses').show();
      } else {
        if (superClasses[0] == "owl:Thing") {
          $("#superclassDetails").html('<tr><td class="firstCol3">owl:Thing</td><td class="secondCol3"><a href="http://www.w3.org/2002/07/owl#Thing" target="_blank"  class="link">owl:Thing</a></td><td class="thirdCol3">Thing. The class of OWL individuals.</td></tr>');
          $('#superclasses').show();
        } else {
          $('#superclasses').hide();
        }
      }

      var propertiesHavingThisRange=getPropertiesOfType(term);
      if (Object.keys(propertiesHavingThisRange).length > 0) {
        var havingRangeContents=tabulateProperties(propertiesHavingThisRange,false,true);
        $("#havingRangeDetails").html(havingRangeContents);
        $('#havingrangeinfo').show();
      } else {
        $('#havingrangeinfo').hide();
      }

      $('#rangeinfo').hide();
      $('#domaininfo').hide();
      $('#siblinginfo').hide();
    }

    if (type == "TypeCode") {
      $("#superclassNote").hide();
      $("#subclassNote").hide();
      $(".termschema").hide();

      $('#triple').hide();
      var instances=getOfType(term);
      var tableContents=tabulateInstances(instances);
      $("#termMemberDetails5").html(tableContents);

      var propertiesHavingThisRange=getPropertiesOfType(term);
      if (Object.keys(propertiesHavingThisRange).length > 0) {
        var havingRangeContents=tabulateProperties(propertiesHavingThisRange,false,true);
        $("#havingRangeDetails").html(havingRangeContents);
        $('#havingrangeinfo').show();
      } else {
        $('#havingrangeinfo').hide();
      }

      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allTypecodes').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedTypecodeinstances').show();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
      $('#siblinginfo').hide();
    }

    if (type == "property") {
      $('#triple').show();
      $('#superclassNote').hide();
      $('#subclassNote').hide();

      var skosExactMatch=getLinkedIDarray(node["skos:exactMatch"],"schema:");
      var skosCloseMatch=getLinkedIDarray(node["skos:closeMatch"],"schema:");
      var skosBroadMatch=getLinkedIDarray(node["skos:broadMatch"],"schema:");
      var skosRelatedMatch=getLinkedIDarray(node["skos:relatedMatch"],"schema:");
      var skosRelated=getLinkedIDarray(node["skos:related"],"schema:");
      var subPropertyOf=getLinkedIDarray(node["rdfs:subPropertyOf"],"schema:");
      var seeAlso=getLinkedIDarray(node["rdfs:seeAlso"],"schema:");

      var schemaEquivalent="";

      if (skosExactMatch.length > 0) {
        schemaEquivalent+=uiText["Exact match:"]+" "+skosExactMatch.join(", ")+"<br>";
      }

      if (skosCloseMatch.length > 0) {
        schemaEquivalent+=uiText["Close match:"]+" "+skosCloseMatch.join(", ")+"<br>";
      }

      if (skosBroadMatch.length > 0) {
        schemaEquivalent+=uiText["Broad match:"]+" "+skosBroadMatch.join(", ")+"<br>";
      }

      if (skosRelatedMatch.length > 0) {
        schemaEquivalent+=uiText["Related match:"]+" "+skosRelatedMatch.join(", ")+"<br>";
      }

      if (subPropertyOf.length > 0) {
        schemaEquivalent+=uiText["Subproperty of:"]+" "+subPropertyOf.join(", ")+"<br>";
      }

      if (skosRelated.length > 0) {
        schemaEquivalent+=uiText["Related (within the context of):"]+" "+skosRelated.join(", ")+"<br>";
      }

      if (seeAlso.length > 0) {
        schemaEquivalent+=uiText["See also:"]+" "+seeAlso.join(", ")+"<br>";
      }

      $("#schemaEquivalent").html(schemaEquivalent);
      if (schemaEquivalent.indexOf('schema:') > -1) {
        $(".termschema").show();
      } else {
        $(".termschema").hide();
      }

      $("#termComment").html(selectLanguage(termComment,uiLanguage));
      var rangeTableContent=tabulateRange(node);
      $("#rangeDetails").html(rangeTableContent);
      $("#rangeShape").html(rangeTableContent);
      if ( (rangeTableContent.indexOf('rdf:langString') > -1) || (rangeTableContent.indexOf('xsd:') > -1) ) {
        $("#rangeShape").attr('class','rect');
      } else {
        $("#rangeShape").attr('class','oval');
      }

      var domainTableContent=tabulateDomain(node);
      $("#domainDetails").html(domainTableContent);
      $("#domainOval").html(domainTableContent);
      $("#predicateArrow").html(term);

      var siblingTableContent=tabulateSiblings(node);
      if (siblingTableContent !== "") {
        $("#siblingDetails").html(siblingTableContent);
        $("#siblinginfo").show();
      } else {
        $("#siblinginfo").hide();
      }

      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allTypecodes').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedTypecodeinstances').hide();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#rangeinfo').show();
      $('#domaininfo').show();
    }

    if (type == "typeCodeInstance") {
      $('#triple').hide();
      $('#superclassNote').hide();
      $('#subclassNote').hide();
      $(".termschema").hide();

      var node=getSingleNode(term);
      var typecode=nodeTypes[term];
      var typecodenode = getSingleNode(typecode);
      var typecodeLabel = typecodenode["rdfs:label"];
      var typecodelabeltext = selectLanguage(typecodeLabel,uiLanguage)
      var termLabelen = selectLanguage(termLabel,uiLanguage);
      var termCommentText = selectLanguage(termComment,uiLanguage);
      $("#termComment").html(termCommentText);

      $("#breadcrumbTrail").html('<li><a href="./" class="link">Geodex Web Vocabulary</a></li><li><a href="./?show=typecodes" class="link">All Type Codes</a></li><li>'+prepareLink2(typecode,typecodelabeltext)+'</li><li id="currentClass">'+termLabelen+'</li>');

      $('#allClasses').hide();
      $('#allProperties').hide();
      $('#allTypecodes').hide();
      $('#propertiesOfClass').hide();
      $('#propertiesOfParentClass').hide();
      $('#propertiesOfGrandparentClass').hide();
      $('#definedTypecodeinstances').hide();
      $('#subclasses').hide();
      $('#superclasses').hide();
      $('#havingrangeinfo').hide();
      $('#siblinginfo').hide();
      $('#rangeinfo').hide();
      $('#domaininfo').hide();
    }
  }
  refreshCatchLinks();
  window.scrollTo(0, 0);
}

function show(url) {
  history.pushState(null, null, url);
  updatestate2(url);
}

function refreshCatchLinks() {
  $( ".link" ).each(function( index ) {
    var orig = $( this ).attr('href');
    if (orig !== undefined) {
      if ((! orig.startsWith("javascript:show(") ) && (! orig.startsWith("http://")) ) {
        $( this ).attr('href',"javascript:show('"+orig+"');");
      }
    }
  });
}

refreshCatchLinks();

function getTerm() {
  var url=window.location.href;
  var ilastslash=url.lastIndexOf("/");
  ilastslash++;
  var term=url.substr(ilastslash);
  return term;
}


var term=getTerm();
updatestate2(term);

window.onpopstate = function(event){
  var term=getTerm();
  updatestate2(term);
};
