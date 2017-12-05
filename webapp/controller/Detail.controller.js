sap.ui.define([
	"cl/everis/cgr/actvinst/allCGRActvInstAll/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV"
], function(BaseController, JSONModel, MessageBox, Export, ExportTypeCSV) {
	"use strict";
	return BaseController.extend("cl.everis.cgr.actvinst.allCGRActvInstAll.controller.Detail", {
		onInit: function() {
			var identityModel = this.getOwnerComponent().getModel("identityModel");
			if (!identityModel){
				this.getHeaderBeforeMe(this.doIdentityCallback);
			}else{		
				var identity = identityModel.getData();
				this.createTreeModel(identity.modelData,this);
			}
			//this._pdfViewer = new PDFViewer();
			//this.getView().addDependent(this._pdfViewer);
			var vUser = "Usuario Hefestos";
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				user: vUser,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		getHeaderBeforeMe: function(callBack){
			var oModel = new sap.ui.model.json.JSONModel();
			var that = this;
			jQuery.ajax({
				type : "GET",
				contentType : "application/json",
				url : "/cgropen/institutional-assets/api/user",
				dataType : "json",
				async: false, 
				success : function(data,textStatus, jqXHR) {
					if ( data === "Undefined" ){
						oModel.setData({modelData : { "iv-user": "Malcainor" }});//5824136-9
					}else{
						oModel.setData({modelData : data});
					}
					callBack(oModel, that);
				},
				error: function(error, jqXHR){
					oModel.setData({modelData : {"iv-user": "Malcainor" }});
					callBack(oModel, that);
				}
			});
		},
		doIdentityCallback: function(oModel,controller){
			var oData = oModel.getData();
			//Creamos modelo
			controller.getOwnerComponent().setModel(oModel,"identityModel");
			//Buscamos Datos de Hefestos
			controller.getLoggedData(oData);
		},
		getLoggedData: function(oData){
			var vVar = "iv-user";
			var vPath = "/DataHefestosSet('" + oData.modelData[vVar] + "')";
			this.readService(vPath,this.doLoggedModelCallback,[]);
		},
		doLoggedModelCallback: function(vData,controller){
			var oModel = controller.getOwnerComponent().getModel("identityModel");
			var oData = oModel.getData();
			oData.fullName = vData.EvName;
			oModel.setData(oData);
			controller.getOwnerComponent().setModel(oModel,"identityModel");
		},
		onSearchLocation: function(oEvt){
			var oTable = this.getView().byId("idEmployeesTable");
			//var oModel = this.getView().getController().getOwnerComponent().getModel();
			var oFilter = new sap.ui.model.Filter("ZzubicTecn", sap.ui.model.FilterOperator.Contains, oEvt.getParameter("query"));
			var oBinding = oTable.getBinding("items");
			oBinding.filter([oFilter]);		
		},	
		onPdf:  function(oEvt){
			var oId = this.getView().byId("NodeIdText");
			var vPath = oId.getProperty("text");
			vPath = "/PDFSet('" + vPath + "')/$value";
			var oModel = this.getOwnerComponent().getModel();
			vPath = oModel.sServiceUrl + vPath; 
			//var vTitle = this.getResourceBundle().getText("pdfPageTitle");
			sap.m.URLHelper.redirect(vPath, true);
			/*this._pdfViewer.setSource(vPath);
			this._pdfViewer.setTitle(vTitle);
			this._pdfViewer.open();*/
		},
		onExcel: sap.m.Table.prototype.exportData || function(oEvt){
			var oId = this.getView().byId("NodeIdText");
			var vPath = oId.getProperty("text");
		    vPath = "/hierarchy_treeSet('" + vPath + "')/AssetsByLocationSet";
			var oExport = new Export({
				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType : new ExportTypeCSV({
					separatorChar : ";"
				}),
				// Pass in the model created above
				models : this.getView().getModel(),
				
				// binding information for the rows aggregation
				rows : {
					path : vPath
				},
				// column definitions with column name and binding info for the content
				columns : [{
					name : this.getResourceBundle().getText("actCol1"),
					template : {
						content : "{Anln1}"
					}
				}, {
					name : this.getResourceBundle().getText("actCol2"),
					template : {
						content : "{Txt50}"
					}
				},{	
					name : this.getResourceBundle().getText("actCol3"),
					template : {
						content : "{Zzserieampliado}"
					}
				},{
					name : this.getResourceBundle().getText("actCol5"),
					template : {
						content : "{ZzasignaUsu}"
					}
				},{
					name : this.getResourceBundle().getText("actCol6"),
					template : {
						content : "{ZzubicTecn}"
					}	
				}]
			});
			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */
		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("hierarchy_treeSet", {
					Nodeid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		_onBindingChange: function() {
		}
	});
});