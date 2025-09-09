package com.irkut.tc.mpdeditor.util;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentDataset;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;

public class UpdateDataset extends AbstractDatasetHandler{

	
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) {
		
		String uid = req.getParameter("uid");
		InputStream inputStream = null;
		try {
			inputStream = req.getInputStream();
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}

		if (uid != null && inputStream != null) {
        // Read the input stream into a string
	        StringBuilder requestBody = new StringBuilder();
	        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
	            String line;
	            while ((line = reader.readLine()) != null) {
	                requestBody.append(line);
	            }
	        } catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

	        String requestBodyString = requestBody.toString();
		}

        // Now, requestBody contains the POST request body
        
	}
	
	private void updateDataset(String uid, String xml) throws TCException {
		TCPreferenceService prefService = session.getPreferenceService();
		TCComponentManager cm = session.getComponentManager();
		TCComponent comp = null;
		try {
				comp = cm.getTCComponent(uid);
			} catch (TCException e1) {
				// TODO Auto-generated catch block
				comp = null;
				e1.printStackTrace();
			}
		
		if (comp != null) {
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
							
//							componentDataset.getFile("CAEAnalysisData", fileNames[0], "C:\\temp");
							
							byte[] xmlbyte = java.util.Base64.getDecoder().decode(xml);
							
							
							// todo java 7 don't have try with rescourse
							try (FileOutputStream fos = new FileOutputStream("C:\\temp\\" + fileNames[0], false)) {
								   fos.write(xmlbyte);
								   fos.flush();
								   //fos.close(); There is no more need for this line since you had created the instance of "fos" inside the try. And this will automatically close the OutputStream
							} catch (FileNotFoundException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
							} catch (IOException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
							}
							
							componentDataset.setFiles(new String[] {"C:\\temp\\" + fileNames[0]}, new String[] {fileNames[0]});

//							TCComponentDataset datasetNew = componentDataset.revise();
//							datasetNew.removeFiles(fileNames[0]);
							
//							return new String(java.util.Base64.getEncoder().encode(Files.readAllBytes(Paths.get("C:\\temp" + "\\" + fileNames[0]))), "UTF8");

//							return new String(Files.readAllBytes(Paths.get("C:\\temp" + "\\" + fileNames[0]))); // TODO: сделать удаление
						
						}

//						componentDataset.getFile("word", fileNames[0], workingDir);
						
//						setHTMLTable(component, getHtmlTableByteArray(new File(workingDir + "\\" + fileNames[0])));
					}
				}
		}
	}
	
}
