package com.irkut.tc.mpdeditor.util;

import javax.servlet.http.HttpServlet;

import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.TCSession;

public class AbstractDatasetHandler extends HttpServlet{
	static protected TCSession session = null;
	
	public AbstractDatasetHandler(){
		super();
		if (session == null)
			session = (TCSession) AIFUtility.getDefaultSession();
	}
}
