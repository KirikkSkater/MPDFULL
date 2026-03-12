package com.irkut.tc.mpdeditor.handlers;

import java.awt.Desktop;
import java.awt.Frame;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;


import com.irkut.tc.mpdeditor.views.OpenMPDDocDialog;
import com.irkut.tc.mpdeditor.util.JettyServer;
import com.irkut.tc.mpdeditor.util.MPDModelHandler;
import com.teamcenter.rac.aif.AIFDesktop;
import com.teamcenter.rac.aif.AbstractAIFApplication;
import com.teamcenter.rac.aif.AbstractAIFCommand;
import com.teamcenter.rac.aif.AbstractAIFUIApplication;
import com.teamcenter.rac.aif.kernel.InterfaceAIFComponent;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.treetable.table.JamSwingCellEditorType;

public class HandlerMPDObject extends AbstractHandler{

	@Override
	public Object execute(ExecutionEvent arg0) throws ExecutionException {
		// TODO Auto-generated method stub

		System.out.println("Scope string:" + TCPreferenceService.getScopeString(TCPreferenceService.TC_preference_site));
		
		
		InterfaceAIFComponent aic = AIFUtility.getTargetComponent();
		TCComponentItemRevision rev = null;
		if (aic instanceof TCComponentItemRevision)
		 {
			rev = (TCComponentItemRevision)aic;
//			 System.out.println(rev.getType()); // TODO: добавить проверки на тип
			 
			 
			
//			 AIFDesktop desktop = AIFUtility.getActiveDesktop();
//				AbstractAIFUIApplication app = AIFUtility.getCurrentApplication();
//				try {
//					UIDCommand cmd = new UIDCommand(desktop, app, arg0.getCommand().getId());
//					if (cmd != null) {
//						cmd.executeModal();
//					}
//				} catch (Exception e) {
//					e.printStackTrace();
//				}
			 
//			 MPDModelHandler mpdHandler = new MPDModelHandler();
		 } else if (aic instanceof TCComponentItem)	{
			 try {
				rev = ((TCComponentItem)aic).getLatestItemRevision();
			 } catch (TCException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			 }
		 }
		
		if (!JettyServer.getInstance().isRunning()) {
			JettyServer.getInstance().start();
		}
		
		if (rev!= null) {
			String url = "http://localhost:9090/static/index.html?uid=" + rev.getUid();
			if (Desktop.isDesktopSupported()) {
	            Desktop desktop = Desktop.getDesktop();
	            try {
	                desktop.browse(new URI(url));
	            } catch (IOException | URISyntaxException e) {
	                System.err.println("Ошибка при открытии URL: " + e.getMessage());
	            }
	        } else {
	            System.err.println("Desktop не поддерживается на этой платформе.");
	        }
		}
//			AIFDesktop desktop = AIFUtility.getActiveDesktop();
//			 try {
//				AbstractAIFCommand cmd = new MPDLinkCommand(desktop, rev.getUid());
//				if (cmd != null) {
//					cmd.executeModal();
//				}
//			} catch (Exception e) {
//				// TODO Auto-generated catch block
//				e.printStackTrace();
//			}
//			 
		return null;
	}
	
	public class MPDLinkCommand extends AbstractAIFCommand{
		
		public MPDLinkCommand(Frame theParent, String uid) throws Exception 
		{
			setRunnable(new OpenMPDDocDialog(theParent, uid));	
		}
	}

}
