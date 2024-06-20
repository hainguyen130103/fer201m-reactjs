import { TinyColor } from "@ctrl/tinycolor";
import {
  Button,
  ConfigProvider,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  Upload,
  message,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import "./index.scss"; // Đường dẫn đến file CSS từ file JSX
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
const colors2 = ["#fc6076", "#ff9a44", "#ef9d43", "#e75516"];

const { Title } = Typography;
import { PlusOutlined } from "@ant-design/icons";
import uploadFile from "../../utils/upload";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function PetManagement() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  const [addForm] = useForm();
  const [editForm] = useForm();

  const handleEditModal = (record) => {
    setEditingPet({ ...record });
    setIsEditing(true);
  };

  const getPresetFileList = () => {
    if (!editingPet || !editingPet.poster) return [];
    return Object.keys(editingPet.poster).map((key) => {
      return {
        uid: key,
        name: editingPet.petName,
        status: "done",
        url: editingPet.poster[key],
      };
    });
  };

  useEffect(() => {
    console.log("useEffect - fileList:", fileList);
    if (isEditing) {
      setFileList(getPresetFileList());
      editForm.setFieldsValue({
        petName: editingPet.petName,
        category: editingPet.category,
        desc: editingPet.desc,
        poster: getPresetFileList(),
      });
    }
  }, [isEditing, editForm, editingPet]);

  const handleUpdate = async (values) => {
    if (!Array.isArray(fileList)) {
      console.error("Expected fileList to be an array but got", fileList);
      message.error("File list is not valid!");
      return;
    }

    const updatedPosters = await Promise.all(
      fileList.map((file) =>
        file.originFileObj ? uploadFile(file.originFileObj) : file.url,
      ),
    );

    const updatedPet = {
      ...editingPet,
      ...values,
      poster: {
        poster1: updatedPosters[0] || editingPet.poster.poster1,
        poster2: updatedPosters[1] || editingPet.poster.poster2,
        poster3: updatedPosters[2] || editingPet.poster.poster3,
      },
    };

    try {
      await axios.put(
        `https://662a755267df268010a405bf.mockapi.io/PetManagement/${editingPet.id}`,
        updatedPet,
      );
      const newDataSource = dataSource.map((item) =>
        item.id === editingPet.id ? updatedPet : item,
      );
      setDataSource(newDataSource);
      setIsEditing(false);
      setEditingPet(null);
      message.success("Pet updated successfully!");
    } catch (error) {
      message.error("Failed to update pet!");
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => {
    if (Array.isArray(newFileList)) {
      setFileList(newFileList);
    } else {
      console.error("newFileList is not an array:", newFileList);
    }
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  const getHoverColors = (colors) =>
    colors.map((color) => new TinyColor(color).lighten(5).toString());

  const getActiveColors = (colors) =>
    colors.map((color) => new TinyColor(color).darken(5).toString());

  const [isOpen, setIsOpen] = useState(false);

  function handleOpenModal() {
    setFileList([]);
    setIsOpen(true);
  }

  function handleCloseModal() {
    setIsOpen(false);
  }

  const columns = [
    {
      // Thêm cột số thứ tự
      title: "No.",
      dataIndex: "index",
      key: "index",
      align: "center",
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: "PetName",
      dataIndex: "petName",
      key: "petName",
      align: "center",
    },
    {
      title: "Time",
      dataIndex: "createAt",
      key: "createAt",
      align: "center",
      render: (values) =>
        values ? formatDistanceToNow(new Date(values)) : null,
    },
    {
      title: "Poster",
      dataIndex: "poster",
      key: "poster",
      render: (poster) => <Image src={poster.poster1} width={200} />,
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      align: "center",
      render: (key, record) => (
        <div style={{ textAlign: "center" }}>
          <Button
            onClick={() => handleEditModal(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Popconfirm
            title="Delete the task"
            description="Are you sure to delete this task?"
            onConfirm={() => handleDelete(key)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const [dataSource, setDataSource] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function fetchPet() {
    const response = await axios.get(
      "https://662a755267df268010a405bf.mockapi.io/PetManagement",
    );
    setDataSource(response.data);
  }

  useEffect(function () {
    fetchPet();
  }, []);

  function handleOk() {
    addForm.submit();
  }

  async function handleSubmit(values) {
    const posters = await Promise.all(
      fileList.map((file) => uploadFile(file.originFileObj)),
    );

    values.poster = {
      poster1: posters[0],
      poster2: posters[1],
      poster3: posters[2],
    };

    values.createAt = new Date();

    try {
      const response = await axios.post(
        "https://662a755267df268010a405bf.mockapi.io/PetManagement",
        values,
      );

      setDataSource([...dataSource, response.data]);
      handleCloseModal();
      addForm.resetFields();
      setFileList([]);
      message.success("Pet added successfully!");
    } catch (error) {
      message.error("Failed to add pet!");
    }
  }

  async function handleDelete(key) {
    try {
      await axios.delete(
        `https://662a755267df268010a405bf.mockapi.io/PetManagement/${key}`,
      );
      console.log("Deleted successfully:", key);
      const listPet = dataSource.filter((item) => item.id !== key);
      setDataSource(listPet);
      message.success("Click on Yes");
    } catch (error) {
      console.error(
        "Error when deleting pet:",
        error.response || error.message,
      );
    }
  }

  return (
    <div className="container">
      <Title>Quản Lí Thú Cưng</Title>
      <Space>
        <ConfigProvider
          theme={{
            components: {
              Button: {
                colorPrimary: `linear-gradient(90deg,  ${colors2.join(", ")})`,
                colorPrimaryHover: `linear-gradient(90deg, ${getHoverColors(
                  colors2,
                ).join(", ")})`,
                colorPrimaryActive: `linear-gradient(90deg, ${getActiveColors(
                  colors2,
                ).join(", ")})`,
                lineWidth: 0,
              },
            },
          }}
        >
          <Button type="primary" size="large" onClick={handleOpenModal}>
            Add Pet
          </Button>
          <Modal
            title="Pet Management"
            open={isOpen}
            onCancel={handleCloseModal}
            onOk={handleOk}
            okText="Add"
          >
            <Form
              form={addForm}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ marginTop: 20 }}
            >
              <Form.Item
                name="petName"
                label="Pet Name"
                rules={[{ required: true, message: "Please enter pet name" }]}
              >
                <Input placeholder="Pet Name" />
              </Form.Item>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please enter category" }]}
              >
                <Input placeholder="Category" />
              </Form.Item>
              <Form.Item
                name="desc"
                label="Description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <Input placeholder="Description" />
              </Form.Item>
              <Form.Item name="poster" label="Poster">
                <Upload
                  action="/upload.do"
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChange}
                >
                  {fileList.length >= 8 ? null : uploadButton}
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
          {previewOpen && (
            <Modal
              open={previewOpen}
              title="Image Preview"
              footer={null}
              onCancel={() => setPreviewOpen(false)}
            >
              <img alt="example" style={{ width: "100%" }} src={previewImage} />
            </Modal>
          )}
        </ConfigProvider>
      </Space>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 20 }}
      />
      <Modal
        title="Edit Pet"
        open={isEditing}
        onCancel={() => {
          setIsEditing(false);
          setEditingPet(null);
        }}
        onOk={() => editForm.submit()}
        okText="Update"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="petName"
            label="Pet Name"
            rules={[{ required: true, message: "Please enter pet name" }]}
          >
            <Input placeholder="Pet Name" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please enter category" }]}
          >
            <Input placeholder="Category" />
          </Form.Item>
          <Form.Item
            name="desc"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <Input placeholder="Description" />
          </Form.Item>
          <Form.Item name="poster" label="Poster">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              beforeUpload={() => false}
            >
              {fileList.length >= 3 ? null : uploadButton}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PetManagement;
