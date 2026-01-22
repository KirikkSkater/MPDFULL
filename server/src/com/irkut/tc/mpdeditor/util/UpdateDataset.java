package com.irkut.tc.mpdeditor.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

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
		
		System.out.println("update dataset start ");
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
	        try {
				updateDataset(uid, requestBodyString);
			} catch (TCException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	        
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
						
						if (componentDataset.getType().equals("VMPFILE")) {
							String[] fileNames = componentDataset.getFileNames("project");
							if (fileNames == null || fileNames.length == 0) {
								System.out.println("filenames == 0");
								continue; 
							}
							
//							componentDataset.getFile("project", fileNames[0], "C:\\temp");
							componentDataset.getFile("project", fileNames[0], "C:\\temp");
							
							byte[] xmlbyte = java.util.Base64.getDecoder().decode(xml);
							
							
							// todo java 7 don't have try with rescourse
//							try (FileOutputStream fos = new FileOutputStream("C:\\temp\\" + fileNames[0], false)) {
//								   fos.write(xmlbyte);
//								   fos.flush();
//								   //fos.close(); There is no more need for this line since you had created the instance of "fos" inside the try. And this will automatically close the OutputStream
//							} catch (FileNotFoundException e) {
//								// TODO Auto-generated catch block
//								e.printStackTrace();
//							} catch (IOException e) {
//								// TODO Auto-generated catch block
//								e.printStackTrace();
//							}
							
							updateVmpXml("C:\\temp\\" + fileNames[0], xmlbyte);
							
							componentDataset.setFiles(new String[] {"C:\\temp\\" + fileNames[0]}, new String[] {"project"});

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
	
	public boolean updateVmpXml(String vmpPath, byte[] newXmlContent) {
	    String tempDir = "C:\\temp\\vmp_extract\\";

	    try {
	        // 1. Очищаем и создаём временную папку
	        File tempFolder = new File(tempDir);
	        if (tempFolder.exists()) {
	            Files.walk(Paths.get(tempDir))
	                 .sorted(Comparator.reverseOrder())
	                 .map(Path::toFile)
	                 .forEach(File::delete);
	        }
	        tempFolder.mkdirs();

	        // 2. Распаковываем все файлы из .vmp
	        try (FileInputStream fis = new FileInputStream(vmpPath);
	             ZipInputStream zis = new ZipInputStream(fis)) {

	            ZipEntry entry;
	            while ((entry = zis.getNextEntry()) != null) {
	                File outputFile = new File(tempDir, entry.getName());
	                try (FileOutputStream fos = new FileOutputStream(outputFile)) {
	                    byte[] buffer = new byte[8192];
	                    int read;
	                    while ((read = zis.read(buffer)) != -1) {
	                        fos.write(buffer, 0, read);
	                    }
	                }
	                zis.closeEntry();
	            }
	        }

	        // 3. Находим целевой XML через цепочку Manuals.xml → idValue.xml → doc_file
	        File targetFile = findTargetXmlFile(tempDir);
	        if (targetFile == null) {
	            throw new Exception("Целевой XML-файл не найден");
	        }

	        // 4. Заменяем содержимое целевого файла
	        Files.write(targetFile.toPath(), newXmlContent);

	        // Убедимся, что файл сохранился
	        if (!Files.exists(targetFile.toPath()) || 
	            Files.readAllBytes(targetFile.toPath()).length == 0) {
	            throw new IOException("Не удалось сохранить обновлённый XML");
	        }

	        // 5. Собираем новый .vmp поверх старого
	        try (FileOutputStream fos = new FileOutputStream(vmpPath);
	             ZipOutputStream zos = new ZipOutputStream(fos)) {

	            Files.walk(Paths.get(tempDir))
	                .filter(Files::isRegularFile)
	                .forEach(path -> {
	                    String entryName = path.toString()
	                        .substring(tempDir.length())
	                        .replace("\\", "/");

	                    ZipEntry zipEntry = new ZipEntry(entryName);
	                    try {
							zos.putNextEntry(zipEntry);
							Files.copy(path, zos);
							zos.closeEntry();
						} catch (IOException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
	                });
	        }

	        // 6. Очищаем временные файлы
	        Files.walk(Paths.get(tempDir))
	             .sorted(Comparator.reverseOrder())
	             .map(Path::toFile)
	             .forEach(File::delete);

	        System.out.println("XML успешно обновлён в архиве: " + vmpPath);
	        return true;

	    } catch (Exception e) {
	        e.printStackTrace();
	        // Попытка очистки при ошибке
	        try {
	            Files.walk(Paths.get(tempDir))
	                 .sorted(Comparator.reverseOrder())
	                 .map(Path::toFile)
	                 .forEach(File::delete);
	        } catch (IOException ignore) {}
	        return false;
	    }
	}

	// Вспомогательный метод для поиска целевого файла по цепочке
	private File findTargetXmlFile(String tempDir) throws Exception {
	    File manualsFile = new File(tempDir, "Manuals.xml");
	    if (!manualsFile.exists()) {
	        throw new FileNotFoundException("Manuals.xml не найден в " + tempDir);
	    }

	    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
	    DocumentBuilder builder = factory.newDocumentBuilder();
	    Document doc = builder.parse(manualsFile);

	    // Извлекаем <id>
	    NodeList idNodes = doc.getElementsByTagName("id");
	    if (idNodes.getLength() == 0) {
	        throw new Exception("<id> не найден в Manuals.xml");
	    }
	    String idValue = idNodes.item(0).getTextContent().trim();
	    if (idValue.startsWith("<![CDATA[") && idValue.endsWith("]]>")) {
	        idValue = idValue.substring(9, idValue.length() - 3).trim();
	    }

	    // Ищем второй XML: idValue.xml
	    String secondXmlName = idValue + ".xml";
	    File secondFile = new File(tempDir, secondXmlName);
	    if (!secondFile.exists()) {
	        throw new FileNotFoundException(secondXmlName + " не найден");
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

	    File targetFile = new File(tempDir, targetFileName);
	    if (!targetFile.exists()) {
	        throw new FileNotFoundException("Целевой файл " + targetFileName + " не найден");
	    }

	    return targetFile;
	}

	
}
