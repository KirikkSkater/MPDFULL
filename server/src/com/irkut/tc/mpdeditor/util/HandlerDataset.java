package com.irkut.tc.mpdeditor.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentDataset;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCComponentItemRevision;
import com.teamcenter.rac.kernel.TCComponentManager;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCPreferenceService;

public class HandlerDataset extends AbstractDatasetHandler{
	

	 private static final long serialVersionUID = 8107420486145169057L;

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
//        				String xml = getXMLModule(comp);
        				String xml = getXMLModuleVMP(comp);
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
private String getXMLModuleVMP(TCComponent comp) throws TCException, IOException {
		 
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
				TCComponentDataset componentDataset = (TCComponentDataset) data;
					
				System.out.println("-----");
				System.out.println("type: " + componentDataset.getType());
				System.out.println("name: " + componentDataset.getStringProperty("object_name"));
				
				if (componentDataset.getType().equals("VMPFILE")) {
				    String[] fileNames = componentDataset.getFileNames("project");
				    if (fileNames == null || fileNames.length == 0) {
				        System.out.println("filenames == 0");
				        return "заглушка XML";
				    }

				    String vmpFilePath = "C:\\temp\\" + fileNames[0];
				    String tempDir = "C:\\temp\\xml_extract\\";


				    try {
				        // 1. Скачиваем архив
				        componentDataset.getFile("project", fileNames[0], "C:\\temp");

				        // Создаём временную папку
				        File tempFolder = new File(tempDir);
				        if (!tempFolder.exists()) tempFolder.mkdirs();

				        List<String> extractedXmls = new ArrayList<>();

				        // 2. Распаковываем все .xml файлы в tempDir
				        try (FileInputStream fis = new FileInputStream(vmpFilePath);
				             ZipInputStream zis = new ZipInputStream(fis)) {

				            ZipEntry entry;
				            while ((entry = zis.getNextEntry()) != null) {
				                String entryName = entry.getName();
				                if (!entryName.toLowerCase().endsWith(".xml")) {
				                    zis.closeEntry();
				                    continue;
				                }

				                // Сохраняем файл на диск
				                File outputFile = new File(tempDir, entryName);
				                try (FileOutputStream fos = new FileOutputStream(outputFile)) {
				                    byte[] buffer = new byte[8192];
				                    int read;
				                    while ((read = zis.read(buffer)) != -1) {
				                        fos.write(buffer, 0, read);
				                    }
				                }
				                extractedXmls.add(entryName);
				                zis.closeEntry();
				            }
				        }

				        // 3. Находим Manuals.xml и получаем idValue
				        File manualsFile = new File(tempDir, "Manuals.xml");
				        if (!manualsFile.exists()) {
				            throw new Exception("Manuals.xml не найден в архиве");
				        }

				        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
				        DocumentBuilder builder = factory.newDocumentBuilder();
				        Document manualsDoc = builder.parse(manualsFile);

				        NodeList idNodes = manualsDoc.getElementsByTagName("id");
				        if (idNodes.getLength() == 0) {
				            throw new Exception("<id> не найден в Manuals.xml");
				        }
				        String idValue = idNodes.item(0).getTextContent().trim();
				        if (idValue.startsWith("<![CDATA[") && idValue.endsWith("]]>")) {
				            idValue = idValue.substring(9, idValue.length() - 3).trim();
				        }
				        String secondXmlName = idValue + ".xml";


				        // 4. Ищем idValue.xml
				        File secondFile = new File(tempDir, secondXmlName);
				        if (!secondFile.exists()) {
				            throw new Exception("Файл " + secondXmlName + " не найден");
				        }

				        Document secondDoc = builder.parse(secondFile);
				        NodeList docFileNodes = secondDoc.getElementsByTagName("doc_file");
				        if (docFileNodes.getLength() == 0) {
				            throw new Exception("<doc_file> не найден во втором XML");
				        }
				        String targetFileName = docFileNodes.item(0).getTextContent().trim();
				        if (targetFileName.startsWith("<![CDATA[") && targetFileName.endsWith("]]>")) {
				            targetFileName = targetFileName.substring(9, targetFileName.length() - 3).trim();
				        }

				        // 5. Находим целевой файл
				        File targetFile = new File(tempDir, targetFileName);
				        if (!targetFile.exists()) {
				            throw new Exception("Целевой файл " + targetFileName + " не найден");
				        }

				        // 6. Читаем содержимое целевого файла и кодируем в Base64
				        byte[] targetBytes = Files.readAllBytes(targetFile.toPath());
				        String base64String = new String(java.util.Base64.getEncoder().encode(targetBytes), "UTF-8");

				        // 7. Удаляем все временные файлы
				        for (String xmlName : extractedXmls) {
				            Files.deleteIfExists(Paths.get(tempDir, xmlName));
				        }
				        Files.deleteIfExists(Paths.get(tempDir)); // Удаляем папку


				        return base64String;


				    } catch (Exception e) {
				        e.printStackTrace();
				        // При ошибке тоже пытаемся удалить временные файлы
				        try {
				            Files.walk(Paths.get(tempDir))
				                 .sorted(Comparator.reverseOrder())
				                 .map(Path::toFile)
				                 .forEach(File::delete);
				        } catch (IOException ignore) {}
				        return "заглушка XML";
				    }
				}
			 }
		 }
		 return "заглушка XML";
	 }
	 
	 
	 private String getXMLModuleVMP2(TCComponent comp) throws TCException, IOException {
		 
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
				TCComponentDataset componentDataset = (TCComponentDataset) data;
					
				System.out.println("-----");
				System.out.println("type: " + componentDataset.getType());
				System.out.println("name: " + componentDataset.getStringProperty("object_name"));
				
				if (componentDataset.getType().equals("VMPFILE")) {
					String[] fileNames = componentDataset.getFileNames("project");
					if (fileNames == null || fileNames.length == 0) {
						System.out.println("filenames == 0");
						continue;
					}
					
					for (String fileName : fileNames) {
						System.out.println("filename:" + fileName);
					}
					try {
					componentDataset.getFile("project", fileNames[0], "C:\\temp");
					
					 String vmpFilePath = "C:\\temp" + "\\" + fileNames[0];
					
					FileInputStream fis = new FileInputStream(vmpFilePath);
		            ZipInputStream zis = new ZipInputStream(fis);
		            Document manualsDoc = null;

		            ZipEntry entry;
		            while ((entry = zis.getNextEntry()) != null) {
		                if ("Manuals.xml".equals(entry.getName())) {
		                    // Читаем XML
		                    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		                    DocumentBuilder builder = factory.newDocumentBuilder();
		                    manualsDoc = builder.parse(new InputSource(new InputStreamReader(zis, "UTF-8")));
		                    break;
		                }
		                zis.closeEntry();
		            }
		            zis.close();
		            fis.close();

		            if (manualsDoc == null) {
		                System.err.println("Файл manuals.xml не найден в архиве.");
		                return "заглушка XML";
		            }

		            // 3. Извлекаем значение <id> (внутри CDATA)
		            NodeList idNodes = manualsDoc.getElementsByTagName("id");
		            if (idNodes.getLength() == 0) {
		                System.err.println("<id> не найден в manuals.xml.");
		                return "заглушка XML";
		            }

		            String idValue = idNodes.item(0).getTextContent().trim();
		            System.out.println("ID: " + idValue);

		            // 4. Ищем <doc_file> с этим ID внутри CDATA
		            NodeList docFileNodes = manualsDoc.getElementsByTagName("doc_file");
		            String docFileName = null;

		            for (int i = 0; i < docFileNodes.getLength(); i++) {
		                String content = docFileNodes.item(i).getTextContent().trim();
		                if (content.contains(idValue)) {
		                    docFileName = content;
		                    break;
		                }
		            }

		            if (docFileName != null) {
		                System.out.println("Найден doc_file: " + docFileName);
		            } else {
		                System.out.println("doc_file с ID не найден.");
		            }

		        } catch (Exception e) {
		            e.printStackTrace();
		        }
					
					
					return new String(java.util.Base64.getEncoder().encode(Files.readAllBytes(Paths.get("C:\\temp" + "\\" + fileNames[0]))), "UTF8");
				}
			 }
		 }
		 return "заглушка XML";
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
						String[] fileNames = componentDataset.getFileNames("project");
						if (fileNames == null || fileNames.length == 0) {
							System.out.println("filenames == 0");
							continue;
						}
						
						for (String fileName : fileNames) {
							System.out.println("filename:" + fileName);
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
