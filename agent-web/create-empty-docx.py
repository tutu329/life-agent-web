#!/usr/bin/env python3
import zipfile
import io

def create_minimal_docx():
    docx_file = io.BytesIO()
    with zipfile.ZipFile(docx_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # [Content_Types].xml
        content_types = '''<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'>
<Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml'/>
<Default Extension='xml' ContentType='application/xml'/>
<Override PartName='/word/document.xml' ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'/>
</Types>'''
        zf.writestr('[Content_Types].xml', content_types)
        
        # _rels/.rels
        rels = '''<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'>
<Relationship Id='rId1' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument' Target='word/document.xml'/>
</Relationships>'''
        zf.writestr('_rels/.rels', rels)
        
        # word/document.xml
        document = '''<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:document xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'>
<w:body>
<w:p><w:r><w:t>这是一个新建的空白文档，可以开始编辑内容。</w:t></w:r></w:p>
</w:body>
</w:document>'''
        zf.writestr('word/document.xml', document)
    
    with open('public/empty.docx', 'wb') as f:
        f.write(docx_file.getvalue())
    
    print('✅ 创建了空白docx文件: public/empty.docx')

if __name__ == '__main__':
    create_minimal_docx() 