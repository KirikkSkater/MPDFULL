package com.irkut.tc.mpdeditor.handlers;

import java.awt.Frame;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;


import com.irkut.tc.mpdeditor.views.OpenMPDDocDialog;
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

public class HandlerMPDObject extends AbstractHandler{

	@Override
	public Object execute(ExecutionEvent arg0) throws ExecutionException {
		// TODO Auto-generated method stub
		
		InterfaceAIFComponent aic = AIFUtility.getTargetComponent();
		
		if (aic instanceof TCComponentItemRevision)
		 {
			TCComponentItemRevision rev = (TCComponentItemRevision)aic;
			 System.out.println(rev.getType()); // TODO: добавить проверки на тип
			 
			 AIFDesktop desktop = AIFUtility.getActiveDesktop();
			 try {
				AbstractAIFCommand cmd = new MPDLinkCommand(desktop, rev.getUid());
				if (cmd != null) {
					cmd.executeModal();
				}
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
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
		 }	 
			 
		return null;
	}
	
	public class MPDLinkCommand extends AbstractAIFCommand{
		
		public MPDLinkCommand(Frame theParent, String uid) throws Exception 
		{
			setRunnable(new OpenMPDDocDialog(theParent, uid));	
		}
	}

}
