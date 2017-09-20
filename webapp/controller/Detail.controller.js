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
		onExcel: sap.m.Table.prototype.exportData || function(oEvt){
			var oExport = new Export({
				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType : new ExportTypeCSV({
					separatorChar : ";"
				}),
				// Pass in the model created above
				models : this.getView().getModel(),
				// binding information for the rows aggregation
				rows : {
					path : "/AssetsByLocationSet"
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