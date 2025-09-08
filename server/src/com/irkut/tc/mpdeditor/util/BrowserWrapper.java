package com.irkut.tc.mpdeditor.util;

import java.io.UnsupportedEncodingException;

import org.eclipse.swt.SWT;
import org.eclipse.swt.SWTError;
import org.eclipse.swt.browser.Browser;
import org.eclipse.swt.browser.BrowserFunction;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.ui.forms.widgets.FormToolkit;
import org.eclipse.ui.forms.widgets.ScrolledForm;

import com.teamcenter.rac.util.MessageBox;

public class BrowserWrapper {
	private Browser browser;
	private ConnectorBrowser connectorBrowser;
	
	/**
	 * @param container
	 */
	
	public void addConnector(ConnectorBrowser connector) {
		connectorBrowser = connector;
	}
	
	public void create(Composite parent){
		
//		HandlerZip handlerZip = new HandlerZip();
		
//		String indexPath = null;
//		try {
//			indexPath = handlerZip.extractZipFromResources("jscodeFolder");
//		} catch (IOException e1) {
//			// TODO Auto-generated catch block
//			e1.printStackTrace();
//		}
		
		FormToolkit toolkit = new FormToolkit(parent.getDisplay());
		ScrolledForm form = toolkit.createScrolledForm(parent);
		form.getBody().setLayout(new FillLayout());
		System.setProperty( "org.eclipse.swt.browser.IEVersion", "11000" );
		try {
			browser = new Browser(form.getBody(), SWT.NONE);
		} catch (SWTError e) {
			e.printStackTrace();
			return;
		}
		
//		if (indexPath == null) {
//			MessageBox.post("Temp was not created", "Error", MessageBox.ERROR);
//			return ;
//		}
		
		browser.setJavascriptEnabled(true);
//		browser.setUrl(indexPath);
//		browser.setUrl("file:///X:\\ugs\\util\\sapkr\\acdms_js\\index.html"); // for test
//		browser.setUrl("file:///C:\\интерактивная таблица_v3\\interactive_table_curr\\интерактивная таблица_v6\\index_curr_teamcenter.html"); // for test

		
		System.out.println(browser.evaluate("var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\\/))\\/?\\s*(\\d+)/i) || []; if (/trident/i.test(M[1])) { tem = /\\brv[ :]+(\\d+)/g.exec(ua) || []; return 'IE ' + (tem[1] || ''); } if (M[1] === 'Chrome') { tem = ua.match(/\\b(OPR|Edge)\\/(\\d+)/); if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera'); } M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?']; if ((tem = ua.match(/version\\/(\\d+)/i)) != null) M.splice(1, 1, tem[1]); return M.join(' ');"));
//		browser = new Browser(container, SWT.BORDER);
//		browser.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true, 1, 1));
//		browser.addLocationListener(new LocationAdapter() {
//			@Override
//			public void changing(LocationEvent event) {
//				if (event.location.startsWith("usercode://")) {
//					event.doit = false;
//					browserContainer.exit(event.location);
//				}
//			}
//		});

//		browser.addTitleListener(new TitleListener() {
//
//			@Override
//			public void changed(TitleEvent evt) {
//				browserContainer.setBrowserTitle(evt.title);
//			}
//		});

//		browser.addStatusTextListener(new StatusTextListener() {
//
//			@Override
//			public void changed(StatusTextEvent evt) {
//				browserContainer.setStatusText(evt.text);
//			}
//		});
		
		final BrowserFunction saveFunction = new BrowserFunction(browser, "saveTC"){
			@Override
			public Object function(Object[] arguments) {
//				save();
				return null;
			}
		};
		
		final BrowserFunction reloadFunction = new BrowserFunction(browser, "reloadTC"){
//			@Override
//			public Object function(Object[] arguments) {
//				String type = selectedComponent.getType();
//				String json="test";
//				
//				if(type.equals("I8_ChangeNoteRevision") 
//						|| type.equals("I8_ChngProposalRevision")
//						|| type.equals("I8_PreNoteRevision"))
//				{
//					try {
//						String typeD = "ii";
//						TCComponent[] revisionsDD;
//						
//							revisionsDD = ((TCComponentItemRevision)selectedComponent).getItem().getTCProperty("revision_list").getReferenceValueArray();
//						
//						for (int i = 0; i < revisionsDD.length; i++) {
//							if(revisionsDD[i].getProperty("item_revision_id").equals(selectedComponent.getProperty("item_revision_id"))){
//								if(i!=0) {
//									typeD = "di";
//								}
//								break;
//							}
//						}
//						
//						//((JsBrowserView)browserContainer).setListenSelection(false);
//						((JsBrowserView)browserContainer).initToolbarByType(type, typeD);
//						((JsBrowserView)browserContainer).updateToolbar(0);
//						json = GetInfoDirDocService.execute(new Object[]{selectedComponent.getUid(), mapNotes});
//						browser.evaluate("loadMain('"+json+"');");
//					} catch (TCException e) {
//						e.printStackTrace();
//					}
//				}
//				return null;
//			}
//		};
		};
		
//		final BrowserFunction getDropObjectFromTeamcenter = new BrowserFunction(browser, "getDropObjectFromTeamcenter"){
//			@Override
//			public Object function(Object[] arguments) {
//				return HandlerTC.getHandlerTC().getDropedObjects();
//			}
//		};
//		
//		final BrowserFunction sendTrakedObjectToTeamcenter = new BrowserFunction(browser, "sendTrakedObjectToTeamcenter"){
//			@Override
//			public Object function(Object[] arguments) {
//				if (arguments[0] instanceof String) {
//					// TODO: вызвать HadnlerTC.updateData
////					HandlerTC.getHandlerTC().updateDataInTamcenter((String)arguments[0]); TODO
//				}
////				connectorBrowser.updateTabelWithCurrentReqs();
//				// TODO: вернуть новые обновлённые объекты;
//				String req="";
//				try {
//					req = new String(java.util.Base64.getEncoder().encode(HandlerTC.getHandlerTC().generateJSONWithCurrent().getBytes("UTF8")), "UTF8");
//				} catch (UnsupportedEncodingException e) {
//					// TODO Auto-generated catch block
//					e.printStackTrace();
//				}				
///*				try {
//					req = java.util.Base64.getEncoder().encodeToString(HandlerTC.getHandlerTC().generateJSONWithCurrent().getBytes());
//					req = new String(Base64.encodeBase64(HandlerTC.getHandlerTC().generateJSONWithCurrent().getBytes(), true), "UTF-8");
//				} catch (UnsupportedEncodingException e) {
//					// TODO Auto-generated catch block
//					e.printStackTrace();
//				}*/
//				return req;
//			}
//		};
		
		final BrowserFunction setEditable = new BrowserFunction(browser, "changeEditMode"){
			@Override
			public Object function(Object[] arguments) {
				if (arguments.length != 0 && arguments[0] instanceof Boolean) {
					connectorBrowser.changeEditMode((Boolean)arguments[0]);
				}
				return null;
			}
		};
		
//		final BrowserFunction clickToObjectToTeamcenter = new BrowserFunction(browser, "clickToObjectToTeamcenter"){
//			@Override
//			public Object function(Object[] arguments) {
//				if (arguments.length != 0 && arguments[0] instanceof String) {
//					HandlerTC.getHandlerTC().clickToObjectToTeamcenter((String)arguments[0]);
//				}
//				return null;
//			}
//		};
//		
//		final BrowserFunction getSelectObjectFromTeamcenter = new BrowserFunction(browser, "getSelectObjectFromTeamcenter"){
//			@Override
//			public Object function(Object[] arguments) {
//				return HandlerTC.getHandlerTC().getSelectedObjects();
//			}
//		};
	}
	
	void updateTable(String jsonAWB){
//		String encodedStr = Base64.getEncoder().encodeToString(jsonAWB.getBytes());
//		String decoded = new String(Base64.getDecoder().decode(encodedStr));

		String req=null;
//		System.out.println(req);
//		req = java.util.Base64.getEncoder().encodeToString(HandlerTC.getHandlerTC().generateJSONWithCurrent().getBytes());	
		try {
			req = "updateTable(\"" + new String(java.util.Base64.getEncoder().encode(jsonAWB.getBytes("UTF8")), "UTF8")+"\");";
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		browser.evaluate(req); // TODO: подумать как это всё в JS Запускать 
	}
}
