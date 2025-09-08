package com.irkut.tc.mpdeditor.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentDataset;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;
import com.teamcenter.rac.kernel.TCSession;

public class HandlerDataset extends AbstractDatasetHandler{
	

	 @Override
     protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
         System.out.println("HandlerDataset");
       
 		String datasetUID = req.getParameter("uid");
 		
 		System.out.println("getDataset: " + datasetUID);
 		
 		if (datasetUID != null) {
 			TCPreferenceService prefService = session.getPreferenceService();
 			TCComponentManager cm = session.getComponentManager();
 			TCComponent comp = null;
 			try {
 				comp = cm.getTCComponent(datasetUID);
 			} catch (TCException e1) {
 				// TODO Auto-generated catch block
 				comp = null;
 				e1.printStackTrace();
 			}
 			
 				if (comp != null) {
 					int status = 200;
 					resp.setContentType("applicatin/json");
        			try {
        				String xml = getXMLModule(comp);
        				System.out.println(xml);
//						resp.getWriter().write("{\"status\": \"ok\",\n \"xml\": \"" + xml +  "\" }");
        				resp.getWriter().write(xml);
					} catch (TCException e) {
						// TODO Auto-generated catch block
						resp.getWriter().write("{\"status\": \"error\"}");
						status = 500;
						e.printStackTrace();
					}
        			resp.getWriter().flush();
        			resp.setStatus(status);
 				}
// 				dataset.get
 		}else {
 			resp.setStatus(400);
 		}

         
	 }
	 
	 private String getXMLModule(TCComponent comp) throws TCException, IOException {
		 
		 TCComponentItemRevision rev = null;
		 
		 if(comp instanceof TCComponentItemRevision) {
			 rev = (TCComponentItemRevision) comp;
		 }else if(comp instanceof TCComponentItem) {
			 rev = ((TCComponentItem)comp).getLatestItemRevision();
		 }
		 
		 TCComponent[] dataset = rev.getRelatedComponents("IMAN_specification");
		 System.out.println("dataset size:" + dataset.length);
		 for (TCComponent data : dataset) {
				if (data instanceof TCComponentDataset) {
					TCComponentDataset componentDataset = (TCComponentDataset)data;
					
					System.out.println("-----");
					System.out.println("type: " + componentDataset.getType());
					System.out.println("name: " + componentDataset.getStringProperty("object_name"));
					
					if (componentDataset.getType().equals("CAEAnalysisDS")) {
						String[] fileNames = componentDataset.getFileNames("CAEAnalysisData");
						if (fileNames == null || fileNames.length == 0) {
							System.out.println("filenames == 0");
							continue;
						}
						
						componentDataset.getFile("CAEAnalysisData", fileNames[0], "C:\\temp");
						
						return new String(java.util.Base64.getEncoder().encode(Files.readAllBytes(Paths.get("C:\\temp" + "\\" + fileNames[0]))), "UTF8");

//						return new String(Files.readAllBytes(Paths.get("C:\\temp" + "\\" + fileNames[0]))); // TODO: сделать удаление
					
					}

//					componentDataset.getFile("word", fileNames[0], workingDir);
					
//					setHTMLTable(component, getHtmlTableByteArray(new File(workingDir + "\\" + fileNames[0])));
				}
			}
		 return "заглушка XML";
	 }
}
