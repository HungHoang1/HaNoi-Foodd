import { Link, useNavigate, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import logo from "../imgs/logo.png";
import defaultBanner from "../imgs/blog_banner.png";
import { uploadImage } from "../common/aws";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import axios from "axios";
import { UserContext } from "../App";

const BlogEditor = () => {
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    setEditorState,
    textEditor,
    setTextEditor,
  } = useContext(EditorContext);

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let { blog_id } = useParams();

  let navigate = useNavigate();

  // useEffect
  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Bắt đầu nhập nội dung của bạn ở đây...",
        })
      );
    }
  }, []);
  const handleBannerUpload = (e) => {
    let img = e.target.files[0];

    if (img) {
      let loadingToast = toast.loading("Đang tải lên...");

      uploadImage(img)
        .then((url) => {
          if (url) {
            toast.dismiss(loadingToast);
            toast.success("Đã tải lên");

            setBlog({ ...blog, banner: url });
          }
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          return toast.error(error);
        });
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      // enter key
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    let input = e.target;

    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  const handlePublishEvent = () => {
    if (!banner.length) {
      return toast.error("Tải lên banner nội dung để xuất bản");
    }

    if (!title.length) {
      return toast.error("Tải lên tiêu đề nội dung để xuất bản nó");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("Viết một cái gì đó để xuất bản nó");
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error(
        "Viết tiêu đề nội dung trước khi lưu dưới dạng bản nháp"
      );
    }

    let loadingToast = toast.loading("Lưu bản nháp...");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((content) => {
          let blogObj = {
            banner,
            title,
            tags,
            des,
            content,
            draft: true,
          };

          axios
            .post(
              import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
              { ...blogObj, id: blog_id },
              {
                headers: { Authorization: `Bearer ${access_token}` },
              }
            )
            .then(() => {
              e.target.classList.remove("disable");

              toast.dismiss(loadingToast);
              toast.success("Đã lưu");

              setTimeout(() => {
                navigate("/dashboard/blogs?tab=draft");
              }, 500);
            })
            .catch(({ response }) => {
              e.target.classList.remove("disable");
              toast.dismiss(loadingToast);

              return toast.error(response.data.error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="logo" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "Nội dung mới"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Xuất bản
          </button>

          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Lưu bản nháp
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mw-auto max-w-[900px] w-full">
            {/* Banner */}
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey rounded-xl">
              <label htmlFor="uploadBanner">
                <img
                  src={banner ? banner : defaultBanner}
                  alt="defaultBanner"
                  className="z-20 rounded-xl"
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg,. jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Tiêu đồ nội dung"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio "></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
