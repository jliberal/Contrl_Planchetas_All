sap.ui.define([
	"cl/everis/cgr/actvinst/allCGRActvInstAll/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(BaseController, JSONModel, Device) {
	"use strict";
	return BaseController.extend("cl.everis.cgr.actvinst.allCGRActvInstAll.controller.Master", {
		onInit : function () {
			//Creamos el modelo de la vista
			this.createTreeModel();
		},
		createTreeModel: function(oView){
			//Buscar tree desde SAP
			var vPath = "/hierarchy_treeSet";
			this.readService(vPath,this.doTreeModelCallback,[]);
		},
		onSelectedTree: function(oEvt){
			var aux = 2;	
		},
		onSearchLocation: function(oEvt){
			//Buscar tree desde SAP
			var vQuery = oEvt.getParameter("query");
			var vPath = "/hierarchy_treeSet";
			var oFilter = new sap.ui.model.Filter("Nodeid", sap.ui.model.FilterOperator.Contains, vQuery);
			this.readService(vPath,this.doTreeModelCallback,[oFilter]);
		},	
		onPressNode: function(oEvt){
			var oNode = oEvt.getSource();
			var regExp = /\(([^)]+)\)/;
			var vCtx1 = oNode.getTitle();
			var tCtx = regExp.exec(vCtx1);
			if (tCtx[1]){
				//Ya tenemos la ubicacion
				var bReplace = !Device.system.phone;
				var vLocation = tCtx[1];
				this.getRouter().navTo("object", {
					objectId : vLocation
				}, bReplace);
			}else{
				var vText = this.getResourceBundle().getText("errorPressNode");
				this.showServiceError(vText);
			}
		},
		doTreeModelCallback: function(oData,controller){
			//Cambiamos data al formato del componente tree
			var oViewData = controller.formatTreeHier(oData);
			//Pasamos data para componente formateado al componente tree
			var oViewModel;
			oViewModel = new JSONModel();
			oViewModel.setData(oViewData);
			controller.getView().setModel(oViewModel,"treeModel");
		},
		formatTreeHier: function(nodesInput){
			//Iteramos oData
			var nodesIn = nodesInput.results;
			var nodes = [];   //'deep' object structure
    		var nodeMap = {}; //'map', each node is an attribute
			if (nodesIn) {
				var nodeOut;
				var parentId;
				for (var i = 0; i < nodesIn.length; i++) {
					var nodeIn = nodesIn[i];
					nodeOut = {
						id: nodeIn.Nodeid,
						text: nodeIn.Description,
						parentId: nodeIn.Parentnodeid,
						children: [] 
					};
					parentId = nodeIn.Parentnodeid;
					if (parentId && parentId.length > 0) {
					    //we have a parent, add the node there
					    //NB because object references are used, changing the node
					    //in the nodeMap changes it in the nodes array too
					    //(we rely on parents always appearing before their children)
					    var parent = nodeMap[nodeIn.Parentnodeid];
					    if (parent) {
					         parent.children.push(nodeOut);
					    }
					} else {
					    //there is no parent, must be top level
					    nodes.push(nodeOut);
					}
					//add the node to the node map, which is a simple 1-level list of all nodes
					nodeMap[nodeOut.id] = nodeOut;
				}
			}
			return nodes;			
		}
	});
});