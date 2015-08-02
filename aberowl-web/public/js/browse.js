$(function() {
  var visitialised = false;
  var ontology = $('#ontology_value').text();
  var versions = []
  var properties = [];
  var st;
  var json;
  var CHILDTOSHOW = 18; //Constant that represents the Number of children to show.
  var MAXCHARTOSHOW = 22; //Constant that represents the Number of characters in a label to show.
  
  $( "#tabs" ).tabs();
  $( "#tabs" ).on( "tabsactivate", function( event, ui ) {
    if(ui.newPanel.selector == '#pubmed') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#pubmed_autocomplete_tagsinput .tag span'),function(e,i){ $('#pubmed_autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#pubmed_autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
      $("#pubmed_button").click();
    } else if(ui.newPanel.selector == '#data') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#data_autocomplete_tagsinput .tag span'),function(e,i){ $('#data_autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#data_autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
      $("#data_button").click();
    } else if(ui.newPanel.selector == '#query') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#autocomplete_tagsinput .tag span'),function(e,i){ $('#autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
    } else if(ui.newPanel.selector == '#sparql') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#squery').val($('#squery').val().replace(/INSERT OWL HERE/, name));
      }
    } else if(ui.newPanel.selector == '#visualise' && !visitialised) {
      //Create a new ST instance  
      visitialised = true;
      st = new $jit.ST({  
          'injectInto': 'infovis',  
          //add styles/shapes/colors  
          //to nodes and edges  
          levelsToShow: 2,
            
          //set overridable=true if you want  
          //to set styles for nodes individually   
          Node: {  
            overridable: true,  
            width: 200,  
            height: 25,  
            color: '#ccc'  
          },  
          //change the animation/transition effect  
          transition: $jit.Trans.Quart.easeOut,  
            
          onBeforeCompute: function(node){  
              console.log("loading " + node.name);  
          },  
            
          onAfterCompute: function(node){  
              console.log("done");  
          },  
        
          //This method is triggered on label  
          //creation. This means that for each node  
          //this method is triggered only once.  
          //This method is useful for adding event  
          //handlers to each node label.  
          onCreateLabel: function(label, node){  
              //add some styles to the node label  
              $('#wat').text(node.name);

              var style = label.style;  
              label.id = node.id;  
              style.color = '#333';  
              style.fontSize = '6';  
              style.textAlign = 'center';  
              style.height = "20px";  
              label.innerHTML = node.name;  
			  if(node.name.length>MAXCHARTOSHOW){
				label.innerHTML = node.name.substr(0,MAXCHARTOSHOW)+"...";
			  }
			  
              //Delete the specified subtree   
              //when clicking on a label.  
              //Only apply this method for nodes  
              //in the first level of the tree.  
              if(node._depth > 0) {  
                  style.cursor = 'pointer';  
                  label.onclick = function() {
					st.onClick(node.id);                       
				   };
              }
          },  
          //This method is triggered right before plotting a node.  
          //This method is useful for adding style   
          //to a node before it's being rendered.  
          onBeforePlotNode: function(node) {  
              if (node._depth > 0) {  
                  node.data.$color = '#f77';  
              }  
          },  

          request: function(nodeId, level, onComplete) {                      
            var node = st.graph.getNode(nodeId);  
            var subtree = $jit.json.getSubtree(eval('('+json+')'),nodeId);
            console.log("node.name-->"+node.name+"	selected-->"+node.selected+"	node.children-->"+node.children+"	subtree.children-->"+subtree.children);
			if((node.selected)&&(node.children===undefined)&&(node.name!=="˅˅˅")&&(node.name!=="˄˄˄")){
				$.when(buildTree(node,level)).done(function(child){	
					subtree = child;
				});
			}else if((node.selected)&&((node.name==="˅˅˅")||(node.name==="˄˄˄"))){
				var parent = node.getParents()[0];
				st.select(parent.id);
				parent.eachSubnode(function(child){
					st.graph.removeNode(child.id);		
				});
				st.labels.clearLabels(); 
				nodeId = parent.id;
				subtree = $jit.json.getSubtree(eval('('+json+')'),nodeId);
				console.log(subtree.toSource());
				for(var posX=0, posY=0;posX < subtree.children.length;posX++,posY++){
					if(node.getData("min") == posY){
						subtree.children[posX].name="˄˄˄";
						subtree.children[posX].data["$min"] = node.getData("min")-CHILDTOSHOW;
						subtree.children[posX].data["$max"] = node.getData("min");
						subtree.children[posX].children = emptyChildren(subtree.children[posX].children);
					}
					if(node.getData("max")+1 == posY){
						subtree.children[posX].name = "˅˅˅";
						subtree.children[posX].data["$min"]= node.getData("max");
						subtree.children[posX].data["$max"] = node.getData("max")+CHILDTOSHOW;
						subtree.children[posX].children = emptyChildren(subtree.children[posX].children);
					}
					if((posY<node.getData("min"))||(posY>(node.getData("max")+1))){
						subtree.children.splice(posX,1); 
						posX = posX - 1;
					} 
					
				}             
			}
			console.log(subtree.toSource());
			onComplete.onComplete(nodeId, subtree);  
		  }	 
        });
		buildTree(null,null);
      } 
   });
   /**
	 * This function update the json structure.
	 */
	function updateJSON(node){
		if((node!=null)&&(node.children!=null)){  
			var object = $.parseJSON(json);  
			var path = getNodePath(node);
			if(typeof(path)!=="undefined"){      
				var nodeIndex = eval("object"+path);
				if((typeof(nodeIndex)!=="undefined")&&(Array.isArray(nodeIndex))){
					$.each(node.children,function(index,child){
						nodeIndex.push(child);
					});										
				}				
			}
			json = JSON.stringify(object);	
			//st.refresh();
		}
	};       
	/**
	 * This function obtains the path of a given node in JSON.
	 */
	function getNodePath(node){
		var child = node;
		var parent = null;
		var path = ".children";
		if(node!=null){
			parent = node.getParents()[0];
			while(parent!=null){         
				var pos = 0;
				parent.eachSubnode(function(subNode){
					if(child.id === subNode.id){
						path = ".children["+(pos)+"]"+path;
					}
					pos = pos + 1;
				});   
				child = parent;
				parent = parent.getParents()[0];
			}
		}    
		return(path);
	}; 
	
	function checkNumberChildren(node){
		if(node.children.length>CHILDTOSHOW){
			node.children = node.children.slice(0,CHILDTOSHOW);
			node.children[CHILDTOSHOW-1].name="˅˅˅";
			node.children[CHILDTOSHOW-1].data["$min"] = CHILDTOSHOW;
			node.children[CHILDTOSHOW-1].data["$max"] = CHILDTOSHOW+CHILDTOSHOW;
			node.children[CHILDTOSHOW-1].children = emptyChildren(node.children[CHILDTOSHOW-1].children);
		}
		return(node);
	};
	
	/**
	 * This function clean the children array of a given node.
	 */
	function emptyChildren(children){
		if($.isArray(children)){
			while(children.length>0){
				children.pop();
			}
		}
		return(children);
	};
	/**
	 * This function prints out recursevely the JSON structure.
	 */
	 function printJSON(node,level){
		console.log(node);
		if(typeof(node) === undefined){
			return;
		}
		var label = node.name;
		for(var i=0;i<level;i++){ label="\t"+label}
		console.log(label);
		$.each(node.children,function(index,child){
			printJSON(child,level+1);
		});
	 };
   
   function getSubClasses(uriClass,ontology,version,type,objectProperty,label){
	   if((type=='subeq')&&(objectProperty!=null)&&(label!=null)){
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+' SOME '+label+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+' SOME '+label+'&ontology='+ontology+'&version='+version));
	   }else{
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+'&ontology='+ontology+'&version='+version));
		}
   };
   function getColor(index){
	   	var numElements = $('.checkbox').length+1;//number of checkboxes and the actual version
	   	console.log(numElements);
		var grades = 360;
		var angle = Math.round(360/numElements)*index;
		return('hsl('+angle+',100%,50%)');
	};
	function buildNode(data,version,level){
		var node = null;
		if(data!=null){
			node = {};
			node['id'] = data.classURI+level; //To avoid graphs
			node['name'] = data.label;
			node['data'] = {};
			node.data['$owlClass'] = encodeURIComponent(data.owlClass);
			node.data['$version'] = version;
			node.data['$color'] = getColor(version);
			node['children'] = []; 

		}	
		return(node)
	}	
	
	function buildTree(node,colorIndex,level){
		var reset = false;
		var def = $.Deferred();
		if(node==null){
			reset = true;
			node = {
			'id': 'root',
			'name': 'Owl:Thing',
			'data': {'$owlClass': '<http://www.w3.org/2002/07/owl%23Thing>','$color':getColor(colorIndex)},
			'children': []
			};
		}
		//At least, we will have one version (the actual version) but the vector is checked. 	
		if((versions!=null)&&(versions.length>0)){
			var index = versions.length;
			node['children'] = []; 
			$.when(getSubClasses(node.data['$owlClass'],ontology,versions.length-1,'subclass',null,null)).then(function(jsonData,textStatus,jqXHR ) {		
				if(jsonData.result!=null){
					//We include all children
					$.each(jsonData.result,function(index,child){
						//the version is the colorIndex,
						node.children.push(buildNode(child,node.data['$version'],level));						
					});					 
					var promises = [];
					//Versions
					for(var index = versions.length-2; index>=0; index--){
						if(versions[index]!=null){
							var promise = getSubClasses(node.data['$owlClass'],ontology,versions[index],'subclass',null,null);
							promises.push(promise);								
						}
					}
					//Properties
					if(node.id!='root'){
						for (var i = 0;i<properties.length;i++){						
							if(properties[i]!=null){
								for(var j = versions.length-1; j>=0; j--){
									if(versions[j]!=null){
										var promise = getSubClasses(node.data['$owlClass'],ontology,versions[j],'subeq',properties[i],node.name);
										promises.push(promise);	
									}
								}
							}					
						}
					}
					
					$.when.apply($,promises).then(function(){
						if(arguments.length>0){
							$.each(arguments,function(promiseIndex,subtree){
								var colorIndex = -1;
								var counter = 0;
								//Searching in the versions vector.
								//We do not search at the last position because it is the actual
								if(promiseIndex<(versions.length-2)){
									for(var i=0,counter=0; i<versions.length-2;i++){
										if(versions[i]!=null){
											counter++;
											if(counter==promiseIndex){
												colorIndex= counter;
												break;
											}
										}

									}
								}
								//Searching in the properties vector.
								if(colorIndex>=0){
									for(var i=0; i < properties.length-1; j++){
										if(properties[i]!=null){
											counter++
											if(counter==promiseIndex){
												colorIndex = counter;
												break;
											}
										}									
									}
								}
								
								$.each(subtree.result,function(index,child){
									console.log('child is already included'+jQuery.inArray(child,jsonData.result));
									if(jQuery.inArray(child,jsonData.result)<0){//The child is not contained
										node.children.push(buildNode(child,colorIndex,level));
									}
									
								});
							});
						}
					});
				}			
			}).done(function(){
				if(reset){
					json=JSON.stringify(node);
					//check the number of nodes before paint
					checkNumberChildren(node);
					//load json data  
					//st.loadJSON(eval( '(' + json + ')' )); 
					st.loadJSON(node);
					//compute node positions and layout  
					st.compute();  
					//optional: make a translation of the tree  
					//Emulate a click on the root node.  
					st.onClick(st.root);  
				}else{
					updateJSON(node);
					checkNumberChildren(node);
				}
				def.resolve(node);								
			});				
		}
		return(def.promise());					
	};
   $.getJSON('/service/api/getObjectProperties.groovy?ontology='+ontology,function(jsonData,textStatus,jqXHR) {
	   console.log(jsonData.toSource());

		if((jsonData!=null)&&(jsonData.length>0)){
			$.each(jsonData,function(key,value){		
				console.log(key);
				console.log(value);
				$('#properties').append($("<option></option>")
			//.attr("value",value)
			.text(key)); 			
			});
		}		
		versions = JSON.parse($('#num_versions').text())
				
		//reset the options selected
		$("#versions option:selected").removeAttr("selected");
		$("#properties option:selected").removeAttr("selected")
		
		$('.multiselect').each(function(component){			
			$(this).multiselect();  
		});
		$('.checkbox').each(function(index){
			//Save the color for the actual version
			if(index>=versions.length){
				index++;
			}
			var color = getColor(index);
			$(this).css('color',color);
			//reset the properties choosen	
		});
		$('#versions').change(function(){
			$('#versions option').each(function(index){
				if($(this).is(':checked')){
					versions[index] = $(this).attr('value');
				}else{
					versions[index] = null;
				}
			});
			console.log(versions.toSource());
			buildTree(null,0);
		});
		$('#properties').change(function(){
			$('#properties option').each(function(index){
				if($(this).is(':checked')){
					properties[index] = $(this).attr('value');
				}else{
					properties[index] = null;
				}
			});
			console.log(properties.toSource());
			buildTree(null,0);
		});	
	  });
});
